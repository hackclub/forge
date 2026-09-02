class ImportMacondoDataJob < ApplicationJob
  queue_as :default

  TRUSTED_CDN_HOST = "cdn.hackclub.com"

  def perform(project_id, macondo_project_id)
    project = Project.find_by(id: project_id)
    unless project
      Rails.logger.warn("ImportMacondoDataJob: project #{project_id} not found, aborting")
      return
    end

    data = MacondoService.get_project(macondo_project_id)
    unless data
      Rails.logger.warn("ImportMacondoDataJob: Macondo project #{macondo_project_id} fetch failed, aborting")
      return
    end

    unless MacondoService.owned_by?(data, project.user)
      Rails.logger.warn("ImportMacondoDataJob: ownership check failed for Macondo project #{macondo_project_id} (owner=#{data["owner"].inspect}), aborting")
      return
    end

    if MacondoService.shipped?(data)
      Rails.logger.warn("ImportMacondoDataJob: Macondo project #{macondo_project_id} already shipped, aborting")
      return
    end

    Rails.logger.info("ImportMacondoDataJob: importing cover image and journals for project #{project_id} from Macondo project #{macondo_project_id}")
    set_cover_image(project, data["thumbnail_url"]) if data["thumbnail_url"].present?
    import_journals(project, data["journals"].presence || MacondoService.get_journals(macondo_project_id))
  end

  private
  def set_cover_image(project, url)
    uri = URI.parse(url)
    unless uri.is_a?(URI::HTTPS) && uri.host == TRUSTED_CDN_HOST
      Rails.logger.error("ImportMacondoDataJob cover image skipped: untrusted host (#{url.inspect})")
      return
    end

    project.update!(cover_image_url: url)
    Rails.logger.info("ImportMacondoDataJob: cover image set for project #{project.id}")
  rescue StandardError => e
    Rails.logger.error("ImportMacondoDataJob cover image failed (#{url.inspect}): #{e.class}: #{e.message}")
  end

  def import_journals(project, journals)
    Array(journals).each_with_index do |j, i|
      title = j["short_brief"].presence || "Imported entry #{j["id"] || i + 1}"
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
