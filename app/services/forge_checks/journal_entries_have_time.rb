module ForgeChecks
  class JournalEntriesHaveTime < Base
    def self.label = "Journal entries log time"
    def self.source = "journal-format.md"

    def call
      return skipped("No devlog entries to check.") if ctx.devlogs.empty?

      missing = ctx.devlogs.reject { |d| d.time_hours.present? && d.time_hours.to_f.positive? }
      return pass("All #{ctx.devlogs.size} entries have time logged.") if missing.empty?

      titles = missing.first(3).map { |d| %("#{d.title.to_s.truncate(40)}") }.join(", ")
      fail!("#{missing.size} of #{ctx.devlogs.size} entries are missing parsed time (e.g. #{titles}). Use a format like \"3 hours\" or \"3h 15m\".")
    end
  end
end
