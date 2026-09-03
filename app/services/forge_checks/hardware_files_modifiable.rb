module ForgeChecks
  # HasHardwareDesignFiles only asks whether *any* CAD/PCB file exists. The fines
  # are more specific than that, and rejected submissions that passed that bar:
  #
  #   "files need to be in modifiable format (STEP not STL)"
  #   "there are only gerbers in the zip file, project is missing pcb project files"
  #   "this repo only contains the gerber files for the PCB; since it's a KiCad
  #    project, it also needs to have the KiCad project files"
  #   "only one of the necessary components has a .STEP file, the rest are .STL only"
  #
  # Reviewers complained that the existing AI scan "flags things as fail that are
  # not true", so this only fails on facts read straight off the file tree and
  # returns `uncertain` whenever the answer depends on the project's design.
  class HardwareFilesModifiable < Base
    def self.label = "CAD and PCB files are in editable formats"
    def self.source = "what-makes-a-project-shipped"

    MODIFIABLE_CAD = /\.(step|stp|f3d|f3z|scad|fcstd|sldprt|ipt|3dm|dwg)$/i
    MESH_ONLY_CAD  = /\.(stl|3mf|obj|ply)$/i
    KICAD_PROJECT  = /\.(kicad_pro|kicad_sch|kicad_pcb)$/i
    GERBER         = /\.(gbr|gtl|gbl|gto|gbo|gts|gbs|drl|gko|g\d+)$/i
    OTHER_EDA      = /\.(sch|brd|epro|json)$/i
    WIRING         = /(wiring|schematic|circuit|pinout|connection)[^\/]*\.(png|jpe?g|webp|svg|pdf)$/i

    def call
      return skipped("Repo tree unavailable — can't scan files.") unless ctx.supported_repo?
      return uncertain("Couldn't fetch the repo file tree — please confirm your editable CAD and PCB sources are pushed.") if ctx.repo_tree.nil?

      problems = [ cad_problem, pcb_problem, wiring_problem ].compact
      return pass("CAD and PCB files are in editable formats.") if problems.empty?

      blocking = problems.select { |p| p[:verdict] == :fail }
      return fail!(blocking.map { |p| p[:message] }.join(" ")) if blocking.any?

      uncertain(problems.map { |p| p[:message] }.join(" "))
    end

    private

    def cad_problem
      mesh = ctx.find_files(MESH_ONLY_CAD)
      editable = ctx.find_files(MODIFIABLE_CAD)
      return nil if mesh.empty? && editable.empty?
      return nil if editable.any? && mesh.size <= editable.size

      if editable.empty?
        { verdict: :fail,
          message: "Your repo has #{mesh.size} mesh file#{'s' if mesh.size != 1} (#{mesh.first}) but no editable CAD source. Push the .STEP / .F3D / .scad so someone else can modify the design — an .STL on its own does not count." }
      else
        { verdict: :uncertain,
          message: "#{mesh.size} mesh files but only #{editable.size} editable source#{'s' if editable.size != 1}. Check every printed part has a .STEP — a fine was issued for exactly this gap." }
      end
    end

    def pcb_problem
      gerbers = ctx.find_files(GERBER)
      kicad = ctx.find_files(KICAD_PROJECT)
      return nil if gerbers.empty?
      return nil if kicad.any? || ctx.find_files(OTHER_EDA).any?

      { verdict: :fail,
        message: "Your repo has Gerber output (#{gerbers.first}) but no PCB project files. Push the .kicad_pro / .kicad_sch / .kicad_pcb (or your EasyEDA export) — Gerbers alone are not reproducible." }
    end

    def wiring_problem
      # Only relevant when there is no PCB to document the connections.
      return nil if ctx.find_files(KICAD_PROJECT).any? || ctx.find_files(GERBER).any?
      return nil if ctx.find_files(OTHER_EDA).any?
      return nil if ctx.find_files(WIRING).any?
      return nil if ctx.readme.match?(/wiring|schematic|pinout|circuit diagram/i)

      { verdict: :uncertain,
        message: "No PCB files and nothing that looks like a wiring diagram. If components are wired by hand, add a wiring diagram to the README — several fines were issued for missing ones." }
    end
  end
end
