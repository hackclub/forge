module ForgeChecks
  class HasHardwareDesignFiles < Base
    def self.label = "Hardware design files in repo"
    def self.source = "submitting.md"

    DESIGN_PATTERN = /\.(kicad_pcb|kicad_sch|kicad_pro|sch|brd|f3d|f3z|step|stp|stl|3mf|fcstd|scad|dxf|gbr|gtl|gbl)$/i

    def call
      return skipped("Repo tree unavailable — can't scan files.") unless ctx.supported_repo?
      return uncertain("Couldn't fetch the repo file tree — please verify your CAD/PCB source files are present.") if ctx.repo_tree.nil?

      matches = ctx.find_files(DESIGN_PATTERN)
      return pass("Found #{matches.size} CAD/PCB source file#{'s' if matches.size != 1} (e.g. `#{matches.first}`).") if matches.any?

      fail!("No CAD/PCB source files found in the repo. Push your KiCad / Fusion / STEP / STL files so others can replicate.")
    end
  end
end
