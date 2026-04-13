class ProjectsController < ApplicationController
  before_action :set_project, only: %i[show edit update destroy submit_for_review submit_build sync_journal set_devlog_mode link_repo resubmit_pitch upload_cover_image export_devlogs mark_built add_kudo destroy_kudo]

  def show
    authorize @project

    render inertia: "Projects/Show", props: {
      project: serialize_project_detail(@project),
      devlogs: @project.devlogs.map { |d| serialize_devlog(d) },
      is_admin_view: policy(@project).update? && @project.user_id != current_user&.id,
      can: {
        update: policy(@project).update?,
        destroy: policy(@project).destroy?,
        submit_for_review: policy(@project).submit_for_review?,
        give_kudos: current_user.present? && current_user.id != @project.user_id
      },
      kudos: @project.kudos.includes(:author).order(created_at: :desc).map { |k| serialize_project_kudo(k) }
    }
  end

  def new
    @project = current_user.projects.build
    authorize @project

    case params[:tier]
    when "tier_1"
      render inertia: "Projects/AdvancedPitch", props: {}
    when "tier_2", "tier_3", "tier_4"
      render inertia: "Projects/Form", props: {
        project: { name: "", subtitle: "", repo_link: "", tags: [], tier: params[:tier] },
        title: "New Project",
        submit_url: projects_path,
        method: "post"
      }
    else
      render inertia: "Projects/New", props: {}
    end
  end

  def create
    @project = current_user.projects.build(project_params)
    @project.status = :draft
    authorize @project

    if @project.save
      audit!("project.created", target: @project, metadata: { tier: @project.tier })
      redirect_to @project, notice: "Project created as draft."
    else
      redirect_back fallback_location: new_project_path(tier: @project.tier), inertia: { errors: @project.errors.messages }
    end
  end

  def edit
    authorize @project

    render inertia: "Projects/Form", props: {
      project: {
        id: @project.id,
        name: @project.name,
        subtitle: @project.subtitle.to_s,
        repo_link: @project.repo_link.to_s,
        tags: @project.tags,
        tier: @project.tier,
        devlog_mode: @project.devlog_mode
      },
      title: "Edit Project",
      submit_url: project_path(@project),
      method: "patch"
    }
  end

  def update
    authorize @project

    if @project.update(project_params)
      audit!("project.updated", target: @project, metadata: { changed: project_params.keys, changes: audit_changes_for(@project) })
      redirect_to @project, notice: "Project updated."
    else
      redirect_back fallback_location: edit_project_path(@project), inertia: { errors: @project.errors.messages }
    end
  end

  def destroy
    authorize @project
    @project.discard
    audit!("project.soft_deleted", target: @project, metadata: { via: "owner" })
    redirect_to explore_path, notice: "Project deleted."
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

  def mark_built
    authorize @project, :update?

    proof_url = params[:build_proof_url].to_s.strip
    if proof_url.blank? || !proof_url.match?(/\Ahttps?:\/\/\S+\z/i)
      redirect_to @project, alert: "Paste a valid URL with proof (image, video, or repo link)."
      return
    end

    @project.update!(build_proof_url: proof_url, built_at: Time.current)
    audit!("project.marked_built", target: @project, metadata: { build_proof_url: proof_url })
    redirect_to @project, notice: "Marked as built. Nice work!"
  end

  def add_kudo
    authorize @project, :show?

    if current_user.id == @project.user_id
      redirect_to @project, alert: "You can't give yourself kudos."
      return
    end

    content = params[:content].to_s.strip
    if content.blank?
      redirect_to @project, alert: "Kudos can't be empty."
      return
    end

    kudo = @project.kudos.create!(content: content, author: current_user, user: @project.user)
    audit!("project.kudo_added", target: @project, metadata: { kudo_id: kudo.id, content: content })
    redirect_to @project, notice: "Kudos sent."
  end

  def destroy_kudo
    authorize @project, :show?
    kudo = @project.kudos.find(params[:kudo_id])

    unless current_user.id == kudo.author_id || current_user.has_permission?("users")
      raise ActionController::RoutingError, "Not Found"
    end

    audit!("project.kudo_destroyed", target: @project, metadata: { kudo_id: kudo.id })
    kudo.destroy
    redirect_to @project, notice: "Kudos deleted."
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
    audit!("project.journal_synced", target: @project)
    redirect_to @project, notice: "Journal synced."
  end

  def export_devlogs
    authorize @project, :update?

    entries = @project.devlogs.order(created_at: :asc)
    md = +"# #{@project.name}\n\n"
    md << "#{@project.subtitle}\n\n" if @project.subtitle.present?

    entries.each do |entry|
      md << "# #{entry.created_at.strftime('%Y-%m-%d')}: #{entry.title}\n\n"
      md << "**Total time spent: #{entry.time_spent}**\n\n" if entry.time_spent.present?
      md << "#{entry.content}\n\n"
    end

    send_data md, filename: "#{@project.name.parameterize}-journal.md", type: "text/markdown"
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

    if @project.cover_image_url.blank?
      redirect_to @project, alert: "Upload a cover image before submitting for review."
      return
    end

    unless current_user.address_line1.present?
      redirect_to @project, alert: "Fill in your shipping address before submitting for review."
      return
    end

    @project.submit_build_for_review!
    audit!("project.build_submitted", target: @project)
    if @project.slack_channel_id.present? && @project.slack_message_ts.present?
      SlackNotifyJob.perform_later(
        channel_id: @project.slack_channel_id,
        thread_ts: @project.slack_message_ts,
        text: ":hammer_and_wrench: *#{@project.name}* has been submitted for build review."
      )
    end
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

    if @project.normal?
      if @project.subtitle.blank?
        redirect_to @project, alert: "Add a short description before submitting for review."
        return
      end

      unless @project.devlogs.any?
        redirect_to @project, alert: "Add at least one devlog entry before submitting for review."
        return
      end

      if @project.cover_image_url.blank?
        redirect_to @project, alert: "Upload a cover image before submitting for review."
        return
      end

      unless current_user.address_line1.present?
        redirect_to @project, alert: "Fill in your shipping address before submitting for review."
        return
      end

      @project.submit_build_for_review!
      audit!("project.build_submitted", target: @project)
      redirect_to @project, notice: "Build submitted for review."
    else
      @project.submit_for_review!
      audit!("project.submitted_for_review", target: @project)
      redirect_to @project, notice: "Project submitted for review."
    end
  end

  def resubmit_pitch
    authorize @project, :update?

    unless @project.returned? && @project.advanced? && @project.slack_channel_id.present? && @project.slack_message_ts.present?
      redirect_to @project, alert: "This project cannot be resubmitted."
      return
    end

    ResubmitPitchJob.perform_later(@project.id)
    redirect_to @project, notice: "Re-fetching your updated pitch from Slack and resubmitting for review..."
  end

  def upload_cover_image
    authorize @project, :update?

    file = params[:cover_image]
    unless file.respond_to?(:read)
      redirect_to @project, alert: "No file uploaded."
      return
    end

    @project.cover_image.attach(file)
    @project.update!(cover_image_url: nil)
    redirect_to @project, notice: "Cover image uploaded. Processing..."
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
    params.expect(project: [ :name, :subtitle, :repo_link, :tier, :devlog_mode, tags: [] ])
  end

  def serialize_project_detail(project)
    {
      id: project.id,
      name: project.name,
      subtitle: project.subtitle,
      tags: project.tags,
      repo_link: project.repo_link,
      status: project.status,
      devlog_mode: project.devlog_mode,
      review_feedback: project.review_feedback,
      tier: project.tier,
      from_slack: project.slack_message_ts.present?,
      cover_image_url: project.cover_image_url,
      built_at: project.built_at&.strftime("%b %d, %Y"),
      build_proof_url: project.build_proof_url,
      airtable_sent: project.airtable_sent?,
      user_id: project.user_id,
      user_display_name: project.user.display_name,
      user_has_address: project.user.address_line1.present?,
      user_address: project.user.address_line1.present? ? {
        address_line1: project.user.address_line1,
        address_line2: project.user.address_line2,
        city: project.user.city,
        state: project.user.state,
        country: project.user.country,
        postal_code: project.user.postal_code,
        phone_number: project.user.phone_number
      } : nil,
      hca_address_portal_url: HcaService.address_portal_url(return_to: project_url(project)),
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

  def serialize_project_kudo(kudo)
    {
      id: kudo.id,
      content: kudo.content,
      author_id: kudo.author_id,
      author_name: kudo.author.display_name,
      author_avatar: kudo.author.avatar,
      author_is_staff: kudo.author.staff?,
      can_destroy: current_user.present? && (current_user.id == kudo.author_id || current_user.has_permission?("users")),
      created_at: kudo.created_at.strftime("%b %d, %Y")
    }
  end
end
