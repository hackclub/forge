class ProjectsController < ApplicationController
  before_action :set_project, only: %i[show edit update destroy submit_for_review submit_build sync_journal set_devlog_mode link_repo]

  def index
    scope = policy_scope(Project).includes(:user, :ships)
    scope = scope.search(params[:query]) if params[:query].present?
    @pagy, @projects = pagy(scope.order(created_at: :desc))

    render inertia: "Projects/Index", props: {
      projects: @projects.map { |p| serialize_project_card(p) },
      pagy: pagy_props(@pagy),
      query: params[:query].to_s
    }
  end

  def show
    authorize @project

    render inertia: "Projects/Show", props: {
      project: serialize_project_detail(@project),
      devlogs: @project.devlogs.map { |d| serialize_devlog(d) },
      can: {
        update: policy(@project).update?,
        destroy: policy(@project).destroy?,
        submit_for_review: policy(@project).submit_for_review?
      }
    }
  end

  def new
    @project = current_user.projects.build
    authorize @project

    render inertia: "Projects/Form", props: {
      project: { name: "", description: "", repo_link: "", tags: [] },
      title: "New Project",
      submit_url: projects_path,
      method: "post"
    }
  end

  def create
    @project = current_user.projects.build(project_params)
    @project.status = :draft
    authorize @project

    if @project.save
      redirect_to @project, notice: "Project created as draft."
    else
      redirect_back fallback_location: new_project_path, inertia: { errors: @project.errors.messages }
    end
  end

  def edit
    authorize @project

    render inertia: "Projects/Form", props: {
      project: {
        id: @project.id,
        name: @project.name,
        description: @project.description.to_s,
        repo_link: @project.repo_link.to_s,
        tags: @project.tags
      },
      title: "Edit Project",
      submit_url: project_path(@project),
      method: "patch"
    }
  end

  def update
    authorize @project

    if @project.update(project_params)
      redirect_to @project, notice: "Project updated."
    else
      redirect_back fallback_location: edit_project_path(@project), inertia: { errors: @project.errors.messages }
    end
  end

  def destroy
    authorize @project
    @project.discard
    redirect_to projects_path, notice: "Project deleted."
  end

  def import_from_github
    authorize Project
    repo_url = params[:repo_url].to_s
    parsed = repo_url.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})

    unless parsed
      render json: { error: "Invalid GitHub repository URL" }, status: :unprocessable_entity
      return
    end

    owner, repo = parsed[1], parsed[2]
    github_base = "https://api.github.com/repos/#{owner}/#{repo}"

    repo_data = fetch_json(github_base)
    unless repo_data
      render json: { error: "Repository not found" }, status: :not_found
      return
    end

    readme_data = fetch_json("#{github_base}/readme")
    readme_content = readme_data && readme_data["content"] ? Base64.decode64(readme_data["content"]).force_encoding("UTF-8") : ""

    commits_data = fetch_json("#{github_base}/commits?per_page=10")
    recent_commits = commits_data.is_a?(Array) ? commits_data.map { |c| c.dig("commit", "message") }.compact.join("\n") : ""

    ai_prompt = <<~PROMPT
      Analyze this GitHub repository and generate a concise project description for a hardware project grants platform called Forge.

      Repository: #{repo_data["full_name"]}
      GitHub Description: #{repo_data["description"] || "None"}
      Language: #{repo_data["language"] || "Unknown"}
      Topics: #{(repo_data["topics"] || []).join(", ").presence || "None"}

      #{readme_content.present? ? "README:\n#{readme_content.truncate(4000)}" : "No README found."}

      #{recent_commits.present? ? "Recent commit messages (devlog):\n#{recent_commits.truncate(2000)}" : ""}

      Respond in valid JSON only, no markdown fences. Use this exact format:
      {"name": "human readable project name", "description": "2-4 sentence description of what this project is, what it does, and what hardware/tech it uses. Write as if the builder is describing their own project.", "tags": ["tag1", "tag2", "tag3"]}
    PROMPT

    ai_response = Net::HTTP.post(
      URI("https://ai.hackclub.com/proxy/v1/chat/completions"),
      { model: "qwen/qwen3-32b", messages: [ { role: "user", content: ai_prompt } ] }.to_json,
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{ENV["HACKCLUB_AI_API_KEY"]}"
    )

    unless ai_response.is_a?(Net::HTTPSuccess)
      render json: { error: "AI service unavailable" }, status: :service_unavailable
      return
    end

    ai_data = JSON.parse(ai_response.body)
    content = ai_data.dig("choices", 0, "message", "content") || ""
    json_match = content.match(/\{[\s\S]*\}/)

    unless json_match
      render json: { error: "Could not parse AI response" }, status: :unprocessable_entity
      return
    end

    parsed_ai = JSON.parse(json_match[0])

    render json: {
      name: parsed_ai["name"] || repo_data["name"],
      description: parsed_ai["description"] || repo_data["description"],
      repo_link: repo_data["html_url"],
      tags: Array(parsed_ai["tags"]).first(5)
    }
  rescue JSON::ParserError
    render json: { error: "Could not parse AI response" }, status: :unprocessable_entity
  end

  def sync_journal
    authorize @project, :update?

    unless @project.repo_link.present?
      redirect_back fallback_location: project_path(@project), alert: "Link a repository first."
      return
    end

    if params[:clear] == "true"
      @project.devlogs.delete_all
    end

    SyncJournalJob.perform_now(@project.id)
    redirect_to @project, notice: "Journal synced."
  end

  def submit_build
    authorize @project, :update?

    unless @project.approved?
      redirect_to @project, alert: "Project must be approved before submitting build."
      return
    end

    unless @project.devlogs.any?
      redirect_to @project, alert: "Add at least one devlog entry before submitting."
      return
    end

    @project.submit_build_for_review!
    notify_slack_decision(@project, "submitted for build review", nil) if @project.slack_channel_id.present?
    redirect_to @project, notice: "Build submitted for review!"
  end

  def set_devlog_mode
    authorize @project, :update?
    mode = params[:devlog_mode]
    unless %w[website git].include?(mode)
      redirect_to @project, alert: "Invalid devlog mode."
      return
    end
    @project.update!(devlog_mode: mode)
    redirect_to @project, notice: mode == "git" ? "Git-based devlogging enabled. Link your repo and add a JOURNAL.md file." : "Website devlogging enabled."
  end

  def link_repo
    authorize @project, :update?
    repo_url = params[:repo_link].to_s.strip
    if repo_url.blank? || !repo_url.match?(/\Ahttps?:\/\/\S+\z/i)
      redirect_to @project, alert: "Enter a valid repository URL."
      return
    end
    @project.update!(repo_link: repo_url)
    redirect_to @project, notice: "Repository linked."
  end

  def submit_for_review
    authorize @project

    unless @project.repo_link.present?
      redirect_back fallback_location: project_path(@project), alert: "You must link a repository before submitting for review."
      return
    end

    @project.submit_for_review!
    redirect_to @project, notice: "Project submitted for review."
  end

  private

  def fetch_json(url)
    uri = URI(url)
    response = Net::HTTP.get_response(uri)
    response.is_a?(Net::HTTPSuccess) ? JSON.parse(response.body) : nil
  rescue StandardError
    nil
  end

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.expect(project: [ :name, :description, :repo_link, tags: [] ])
  end

  def serialize_project_card(project)
    {
      id: project.id,
      name: project.name,
      description: project.description&.truncate(200),
      tags: project.tags,
      status: project.status,
      user_display_name: project.user.display_name,
      ships_count: project.ships.size
    }
  end

  def serialize_project_detail(project)
    {
      id: project.id,
      name: project.name,
      description: project.pitch_text || project.description,
      repo_link: project.repo_link,
      tags: project.tags,
      status: project.status,
      devlog_mode: project.devlog_mode,
      hcb_grant_link: project.hcb_grant_link,
      review_feedback: project.review_feedback,
      user_display_name: project.user.display_name,
      created_at: project.created_at.strftime("%B %d, %Y")
    }
  end

  def serialize_devlog(devlog)
    {
      id: devlog.id,
      title: devlog.title,
      content: devlog.content,
      time_spent: devlog.time_spent,
      created_at: devlog.created_at.strftime("%B %d, %Y")
    }
  end
end
