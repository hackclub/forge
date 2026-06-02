module ForgeChecks
  class BomCsvInRepo < Base
    def self.label = "BOM.csv in repo"
    def self.source = "submitting.md"

    BOM_PATTERN = %r{(^|/)(bom|bill[\s_-]?of[\s_-]?materials|parts[\s_-]?list).*\.(csv|xlsx|tsv)$}i

    def call
      return skipped("Repo tree unavailable — can't scan files.") unless ctx.supported_repo?

      matches = ctx.find_files(BOM_PATTERN)
      return uncertain("Couldn't fetch the repo file tree — please verify a BOM file is present.") if ctx.repo_tree.nil?
      return pass("Found BOM file: `#{matches.first}`.") if matches.any?

      fail!("No BOM.csv (or .xlsx) found in your repo. Add one with parts, quantities, and links.")
    end
  end
end
