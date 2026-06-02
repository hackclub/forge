module ForgeChecks
  class HasJournalEntries < Base
    def self.label = "Devlog/journal entries"
    def self.source = "how-to-journal.md"

    def call
      count = ctx.devlogs.size
      return fail!("No devlog entries yet. Add at least one entry describing what you built.") if count.zero?

      pass("#{count} devlog entr#{count == 1 ? 'y' : 'ies'} logged.")
    end
  end
end
