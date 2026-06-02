module ForgeChecks
  class TotalHoursLogged < Base
    MIN_HOURS = 1.0

    def self.label = "Hours logged"
    def self.source = "how-to-journal.md"

    def call
      hours = ctx.total_devlog_hours.to_f
      return fail!("No hours logged yet. Make sure each devlog entry has a parsed time.") if hours.zero?
      return uncertain("Only #{hours.round(1)}h logged so far — fine if that's accurate, just double-check.") if hours < MIN_HOURS

      pass("#{hours.round(1)} hours logged across #{ctx.devlogs.size} entries.")
    end
  end
end
