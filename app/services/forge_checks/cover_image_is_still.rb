module ForgeChecks
  # 97 of the 700 fines were screenshot problems — the largest category after
  # duplicates. Forge has already been fined twice for it ("screenshot is a gif
  # please change it", "the screenshot is not of their own work").
  #
  # Animation and file type are decidable here; whether the image actually shows
  # the project running is left to AiOriginalityCheck and the reviewer.
  class CoverImageIsStill < Base
    def self.label = "Cover image is a still photo of the project"
    def self.source = "submitting.md"

    ANIMATED = /\.(gif|apng|webm|mp4|mov|avi|mkv|m4v|mts)(\?|#|$)/i
    NON_IMAGE = /\.(pdf|csv|txt|zip|json|svg)(\?|#|$)/i

    def call
      url = ctx.project.cover_image_url.to_s
      return fail!("Upload a cover image for your project on Forge.") if url.blank?

      if url.match?(ANIMATED)
        return fail!("Your cover image is animated (#{extension(url)}). It has to be a still image — Forge has already been fined for a GIF cover.")
      end

      if url.match?(NON_IMAGE)
        return fail!("Your cover image is a #{extension(url)} file, not a photo. Upload a still image of the built project.")
      end

      pass("Cover image is a still image.")
    end

    private

    def extension(url)
      ".#{url[/\.([a-z0-9]+)(?:\?|#|$)/i, 1].to_s.downcase}"
    end
  end
end
