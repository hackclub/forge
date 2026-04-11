class AirtableSyncJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    return unless AirtableService.enabled?

    project = Project.find_by(id: project_id)
    return unless project

    user = project.user
    fields = build_fields(project, user)
    AirtableService.upsert_by_forge_id(project.id, fields)
  end

  private

  def build_fields(project, user)
    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    playable_url = "#{app_url}/projects/#{project.id}"

    fields = {
      "Code URL" => project.repo_link,
      "Playable URL" => playable_url,
      "Description" => project.pitch_text,
      "GitHub Username" => github_username(project.repo_link),
      "First Name" => user.first_name,
      "Last Name" => user.last_name,
      "Email" => user.email,
      "Address (Line 1)" => user.address_line1,
      "Address (Line 2)" => user.address_line2,
      "City" => user.city,
      "State / Province" => user.state,
      "Country" => user.country,
      "ZIP / Postal Code" => user.postal_code,
      "Birthday" => user.birthday&.iso8601,
      "Slack ID" => user.slack_id,
      "Optional - Override Hours Spent" => project.override_hours&.to_f,
      "Optional - Override Hours Spent Justification" => project.override_hours_justification,
      "Forge Status" => project.status
    }

    if project.cover_image_url.present?
      fields["Screenshot"] = [ { "url" => project.cover_image_url } ]
    end

    fields.compact
  end

  def github_username(repo_url)
    return nil if repo_url.blank?

    match = repo_url.match(%r{github\.com/([^/]+)/})
    match ? match[1] : nil
  end
end
