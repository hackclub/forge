module ForgeChecks
  class ReadmeHasBomTable < Base
    def self.label = "Bill of Materials"
    def self.source = "submitting.md"

    BOM_KEYWORDS = /\b(bom|bill of materials|parts list)\b/i
    TABLE_ROW = /\|.+\|.+\|/
    BOM_FILE_PATTERN = %r{(^|/)(bom|bill[\s_-]?of[\s_-]?materials|parts[\s_-]?list).*\.(csv|xlsx|tsv)$}i

    def call
      return skipped("No README or repo to check.") unless ctx.readme_present? || ctx.supported_repo?

      return pass("Found a BOM table in your README.") if readme_bom_table?

      bom_file = repo_bom_files.first
      return pass("Found BOM file: `#{bom_file}`.") if bom_file

      return uncertain("README mentions a BOM but I don't see a markdown table or a BOM file in your repo — make sure parts are listed in a table or add a BOM.csv.") if readme_mentions_bom?
      return uncertain("Couldn't fetch the repo file tree — add a BOM table to your README or double-check a BOM file is in your repo.") if ctx.supported_repo? && ctx.repo_tree.nil?

      fail!("No Bill of Materials found. Add a BOM table to your README or a BOM file (CSV/XLSX) to your repo, listing parts, quantities, and links.")
    end

    private

    def readme_mentions_bom?
      ctx.readme_present? && ctx.readme.match?(BOM_KEYWORDS)
    end

    def readme_bom_table?
      return false unless ctx.readme_present?

      sections = ctx.readme.split(/^\#{1,6}\s+/m)
      sections.any? { |s| s.match?(BOM_KEYWORDS) && s.match?(TABLE_ROW) }
    end

    def repo_bom_files
      return [] unless ctx.supported_repo?

      ctx.find_files(BOM_FILE_PATTERN)
    end
  end
end
