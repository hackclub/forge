require "open-uri"

class ImportMacondoDataJob < ApplicationJob
  queue_as :default

  def perform(project_id, macondo_project_id)
    project = Project.find_by(id: project_id)
    return unless project

    data = MacondoService.get_project(macondo_project_id)
    return unless data
    return unless MacondoService.owned_by?(data, project.user)
    return if MacondoService.shipped?(data)

    attach_cover_image(project, data["thumbnail_url"]) if data["thumbnail_url"].present?
    import_journals(project, data["journals"].presence || MacondoService.get_journals(macondo_project_id))
  end

  private

  def attach_cover_image(project, url)
    io = URI.open(url)
    filename = File.basename(URI.parse(url).path.presence || "cover.png")
    project.cover_image.attach(io: io, filename: filename)
  rescue StandardError => e
    Rails.logger.error("ImportMacondoDataJob cover image failed: #{e.message}")
  end

  def import_journals(project, journals)
    Array(journals).each do |j|
      title = j["short_brief"].presence || "Imported entry"
      next if project.devlogs.exists?(title: title)

      project.devlogs.create!(
        title: title,
        content: j["long_brief"].presence || j["short_brief"].presence || "Imported from Macondo.",
        time_hours: j["hours"],
        entry_date: j["created_at"]&.to_date
      )
    end
  rescue StandardError => e
    Rails.logger.error("ImportMacondoDataJob journals failed: #{e.message}")
  end
end
