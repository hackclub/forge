module ForgeChecks
  # Duplicates are the largest fine category overall (164 of 700) and four of
  # Forge's own nineteen fines were repos already submitted to Blueprint or
  # Stasis. Surfacing it to the builder before they submit is cheaper than
  # rejecting them after.
  class NoDuplicateSubmission < Base
    def self.label = "Not already submitted to another program"
    def self.source = "project-exceptions"

    def call
      return skipped("No repo linked yet.") if ctx.repo_link.blank?

      scan = DuplicateScan.run(ctx.project)
      return skipped(scan["reason"] || "Nothing to compare.") if scan["slug"].blank?

      case scan["verdict"]
      when "blocked" then fail!(blocked_message(scan))
      when "review" then uncertain(review_message(scan))
      else
        if scan["unified_error"]
          uncertain("Couldn't reach the Unified Database to check for a duplicate — a reviewer will verify this by hand.")
        elsif scan["unified_available"]
          pass("This repo has not been submitted to another program.")
        else
          uncertain("Checked Forge only — the Unified DB lookup is not configured, so a reviewer will verify this by hand.")
        end
      end
    end

    private

    def blocked_message(scan)
      elsewhere = scan["unified"].map { |r| r["program"] }.compact.uniq
      return "This repo is already in the Unified Database under #{elsewhere.join(', ')}. The same work cannot be paid twice — if this is an update, say so in your description and explain what is new." if elsewhere.any?

      return "This project is already shipped on Macondo. Submitting the same work to both programs is double-dipping." if scan["macondo"].any?

      other = scan["forge"].find { |m| m["status"] == "approved" }
      "This repo was already approved on Forge as #{other['name'].inspect} by #{other['owner']}."
    end

    def review_message(scan)
      names = scan["forge"].map { |m| m["name"].inspect }.uniq
      "The same repo is on #{scan['forge'].size} other Forge project#{'s' if scan['forge'].size != 1} (#{names.join(', ')}). That is fine for a design/build pair or a genuine update — make sure your description says which."
    end
  end
end
