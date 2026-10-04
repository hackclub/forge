require "vips"

class CropCoverImageJob < ApplicationJob
  MAX_DIMENSION = 4000
  MAX_SCALE = 5

  queue_as :default

  def perform(project_id, crop)
    project = Project.find_by(id: project_id)
    return if project.nil? || project.cover_image_url.blank?

    source = download(project.cover_image_url)
    return if source.blank?

    image = Vips::Image.new_from_buffer(source, "")
    result = render(image, pixel_region(image, crop))
    return if result.nil?

    cropped = result.write_to_buffer(".png")

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

  # The region may extend past the image when the user zooms out; the overhang is
  # filled with transparency so the whole cover is kept instead of being cut.
  def render(image, region)
    left, top, width, height = region
    inner_left = left.clamp(0, image.width)
    inner_top = top.clamp(0, image.height)
    inner_right = (left + width).clamp(0, image.width)
    inner_bottom = (top + height).clamp(0, image.height)
    return nil if inner_right <= inner_left || inner_bottom <= inner_top

    piece = image.extract_area(inner_left, inner_top, inner_right - inner_left, inner_bottom - inner_top)
    piece = piece.add_alpha unless piece.has_alpha?
    canvas = piece.embed(inner_left - left, inner_top - top, width, height, extend: :background, background: [ 0, 0, 0, 0 ])

    longest = [ width, height ].max
    longest > MAX_DIMENSION ? canvas.resize(MAX_DIMENSION.to_f / longest) : canvas
  end

  def pixel_region(image, crop)
    left = (crop["x"].to_f * image.width).round
    top = (crop["y"].to_f * image.height).round
    width = (crop["width"].to_f * image.width).round.clamp(1, image.width * MAX_SCALE)
    height = (crop["height"].to_f * image.height).round.clamp(1, image.height * MAX_SCALE)
    [ left, top, width, height ]
  end
end
