module ForgeChecks
  class HasCoverImage < Base
    def self.label = "Cover image"
    def self.source = "submitting.md"

    def call
      return pass("Cover image is set.") if ctx.project.cover_image_url.present?

      fail!("Upload a cover image for your project on Forge.")
    end
  end
end
