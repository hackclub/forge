module ForgeChecks
  class ReadmeHasImages < Base
    MIN_IMAGES = 2

    def self.label = "README has images"
    def self.source = "submitting.md"

    def call
      return skipped("No README to check.") unless ctx.readme_present?

      count = ctx.readme_image_refs.size
      return fail!("Your README has no images. Add screenshots of your build, PCB, schematic, and/or 3D model.") if count.zero?
      return uncertain("Found #{count} image#{'s' if count != 1} in your README. (#{MIN_IMAGES}+ is the usual bar.) I can't see what they show — double-check they include a PCB / schematic / 3D render / build photo.") if count < MIN_IMAGES

      uncertain("Found #{count} images in your README — I can't see what they show, so make sure they cover a PCB, schematic / wiring diagram, 3D model, and a build photo.")
    end
  end
end
