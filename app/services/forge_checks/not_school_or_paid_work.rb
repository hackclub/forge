module ForgeChecks
  # School assignments and paid Hack Club work cannot enter the Unified DB at
  # all — not deflated, not with a justification. Several programs were fined
  # for submissions whose own README said "this is my grade 11 capstone".
  class NotSchoolOrPaidWork < Base
    def self.label = "Not a school assignment or paid Hack Club work"
    def self.source = "project-exceptions"

    SCHOOL = /\b(school\s+(project|assignment|homework)|class\s+(project|assignment)|capstone|coursework|graded\s+assignment|for\s+my\s+(cs|computer\s+science)\s+class|university\s+project|college\s+assignment|semester\s+project|final\s+year\s+project|my\s+teacher)\b/i
    PAID = /\b(hack\s*club\s+(internship|intern|paid\s+work)|i\s+was\s+paid\s+by\s+hack\s*club|as\s+part\s+of\s+my\s+internship)\b/i

    def call
      haystack = [ ctx.readme, ctx.project.description, ctx.devlog_text ].join("\n")
      return skipped("Nothing to scan yet.") if haystack.strip.blank?

      if (hit = haystack[SCHOOL])
        return fail!("Your submission mentions #{hit.strip.inspect}. School and class assignments are not eligible for Forge — if this is not one, reword it so a reviewer is not misled.")
      end

      if (hit = haystack[PAID])
        return fail!("Your submission mentions #{hit.strip.inspect}. Work Hack Club already paid you for cannot be submitted.")
      end

      pass("No school-assignment or paid-work markers found.")
    end
  end
end
