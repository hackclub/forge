require "vips"

class CropCoverImageJob < ApplicationJob
  queue_as :default

  def perform(project_id, crop)
    project = Project.find_by(id: project_id)
    return if project.nil? || project.cover_image_url.blank?

    source = download(project.cover_image_url)
    return if source.blank?

    image = Vips::Image.new_from_buffer(source, "")
    cropped = image.crop(*pixel_region(image, crop)).write_to_buffer(".png")

    filename = "cover-#{project.id}.png"
    io = StringIO.new(cropped)
    cdn_url = HcCdnService.upload(io: io, filename: filename, content_type: "image/png")

    if cdn_url.present?
      project.update!(cover_image_url: cdn_url)
    else
      io.rewind
      blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: "image/png")
      app_url = ENV.fetch("APP_URL") { Rails.env.development? ? "http://localhost:3000" : "https://forge.hackclub.com" }
      project.update!(cover_image_url: Rails.application.routes.url_helpers.rails_blob_url(blob, host: app_url))
    end
  rescue Vips::Error => e
    Rails.logger.error("Cover image crop failed for project #{project_id}: #{e.message}")
  end

  private

  def download(url)
    response = Faraday.get(url) do |req|
      req.options.open_timeout = 5
      req.options.timeout = 20
    end

    return nil unless response.success?

    response.body
  rescue StandardError => e
    Rails.logger.error("Cover image download failed: #{e.class}: #{e.message}")
    nil
  end

  def pixel_region(image, crop)
    left = (crop["x"].to_f * image.width).round.clamp(0, image.width - 1)
    top = (crop["y"].to_f * image.height).round.clamp(0, image.height - 1)
    width = (crop["width"].to_f * image.width).round.clamp(1, image.width - left)
    height = (crop["height"].to_f * image.height).round.clamp(1, image.height - top)
    [ left, top, width, height ]
  end
end
