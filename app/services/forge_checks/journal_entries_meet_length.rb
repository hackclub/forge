module ForgeChecks
  class JournalEntriesMeetLength < Base
    MIN_LENGTH = 100

    def self.label = "Devlog entries are detailed"
    def self.source = "how-to-journal.md"

    def call
      return skipped("No devlog entries to check.") if ctx.devlogs.empty?

      too_short = ctx.devlogs.reject do |d|
        text = d.content.to_s.gsub(/\[([^\]]+)\]\([^)]+\)/, '\1').gsub(/[<>]/, "")
        text.length >= MIN_LENGTH
      end
      return pass("All #{ctx.devlogs.size} entries clear the #{MIN_LENGTH}-char bar.") if too_short.empty?

      titles = too_short.first(3).map { |d| %("#{d.title.to_s.truncate(40)}") }.join(", ")
      fail!("#{too_short.size} of #{ctx.devlogs.size} entries are under #{MIN_LENGTH} characters (e.g. #{titles}). Add more detail on what you did and why.")
    end
  end
end
