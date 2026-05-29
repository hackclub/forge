module ForgeChecks
  class ReadmeHasBomTable < Base
    def self.label = "Bill of Materials in README"
    def self.source = "submitting.md"

    BOM_KEYWORDS = /\b(bom|bill of materials|parts list)\b/i
    TABLE_ROW = /\|.+\|.+\|/

    def call
      return skipped("No README to check.") unless ctx.readme_present?

      has_section = ctx.readme.match?(BOM_KEYWORDS)
      has_table_near_bom = bom_table_present?

      return pass("Found a BOM table in your README.") if has_section && has_table_near_bom
      return uncertain("README mentions a BOM but I don't see a markdown table — make sure parts are listed in a table format.") if has_section
      return fail!("No Bill of Materials found in your README. Add a BOM table listing parts, quantities, and links.") if !has_section

      uncertain("Couldn't confirm a BOM table in the README — double-check.")
    end

    private

    def bom_table_present?
      sections = ctx.readme.split(/^\#{1,6}\s+/m)
      sections.any? { |s| s.match?(BOM_KEYWORDS) && s.match?(TABLE_ROW) }
    end
  end
end
