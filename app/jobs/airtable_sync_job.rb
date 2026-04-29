class AirtableSyncJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find_by(id: project_id)
    return unless project

    AirtableQueueItem.enqueue_for_project(project)
  end

  def self.build_fields(project)
    user = project.user
    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    playable_url = "#{app_url}/projects/#{project.id}"

    fields = {
      "Code URL" => project.repo_link,
      "Playable URL" => playable_url,
      "Description" => project.pitch_text.presence || project.description.presence || project.subtitle,
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
      "Phone Number" => user.phone_number,
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

  def self.github_username(repo_url)
    return nil if repo_url.blank?

    match = repo_url.match(%r{github\.com/([^/]+)/})
    match ? match[1] : nil
  end
end
