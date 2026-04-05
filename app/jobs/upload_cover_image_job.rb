class UploadCoverImageJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find_by(id: project_id)
    return unless project&.cover_image&.attached?

    app_url = ENV.fetch("APP_URL", "https://forge.hackclub.com")
    blob_url = Rails.application.routes.url_helpers.rails_blob_url(project.cover_image, host: app_url)

    cdn_url = HcCdnService.mirror(blob_url)

    if cdn_url.present?
      project.update!(cover_image_url: cdn_url)
      project.cover_image.purge_later
    else
      project.update!(cover_image_url: blob_url)
    end
  end
end
