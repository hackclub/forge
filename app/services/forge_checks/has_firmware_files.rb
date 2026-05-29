module ForgeChecks
  class HasFirmwareFiles < Base
    def self.label = "Firmware/code in repo"
    def self.source = "submitting.md"

    CODE_PATTERN = /\.(ino|c|cpp|h|hpp|py|rs|go|js|ts|asm|s|v|sv|vhdl|uf2|hex|bin)$/i

    def call
      return skipped("Repo tree unavailable — can't scan files.") unless ctx.supported_repo?
      return uncertain("Couldn't fetch the repo file tree — please verify firmware/code is present.") if ctx.repo_tree.nil?

      matches = ctx.find_files(CODE_PATTERN)
      return pass("Found #{matches.size} firmware/code file#{'s' if matches.size != 1}.") if matches.any?

      uncertain("Didn't spot any firmware/code files in the repo — if your project has firmware, make sure it's pushed. (OK to skip if there's no firmware.)")
    end
  end
end
