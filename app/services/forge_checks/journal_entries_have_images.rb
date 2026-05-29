module ForgeChecks
  class JournalEntriesHaveImages < Base
    IMAGE_PATTERN = /!\[[^\]]*\]\([^)]+\)|<img\s/i

    def self.label = "Devlog entries have images"
    def self.source = "how-to-journal.md"

    def call
      return skipped("No devlog entries to check.") if ctx.devlogs.empty?

      without_images = ctx.devlogs.reject { |d| d.content.to_s.match?(IMAGE_PATTERN) }
      return pass("Every devlog entry includes at least one image.") if without_images.empty?

      titles = without_images.first(3).map { |d| %("#{d.title.to_s.truncate(40)}") }.join(", ")
      fail!("#{without_images.size} of #{ctx.devlogs.size} devlog entries have no images (e.g. #{titles}). Add progress photos.")
    end
  end
end
