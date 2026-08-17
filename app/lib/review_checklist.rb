class ReviewChecklist
  HANDBOOK = "https://docs.hackclub.com/handbook/quality-and-integrity".freeze

  ITEMS = [
    {
      key: "repo_public",
      label: "Repo is public and opens without a login",
      note: "Public, version-controlled, and browsable by anyone",
      doc: "#{HANDBOOK}/required-submission-fields",
      stages: %w[design build]
    },
    {
      key: "readme",
      label: "README explains what it is and how to build it",
      note: "Anything beyond soldering parts where the PCB labels them",
      doc: "#{HANDBOOK}/required-submission-fields",
      stages: %w[design build]
    },
    {
      key: "bom",
      label: "BOM lists every component with specific part names",
      note: "\"Seeed Studio XIAO RP2040\", not \"microcontroller\" — including parts they already owned",
      doc: "#{HANDBOOK}/what-makes-a-project-shipped",
      stages: %w[design build]
    },
    {
      key: "cad",
      label: "3D models are in a modifiable format",
      note: ".STEP / .F3D — an .STL on its own does not count",
      doc: "#{HANDBOOK}/what-makes-a-project-shipped",
      stages: %w[design build]
    },
    {
      key: "schematic",
      label: "Schematic and PCB files, or a wiring diagram if there is no PCB",
      note: "KiCad: .kicad_pro, .kicad_sch, .kicad_pcb",
      doc: "#{HANDBOOK}/what-makes-a-project-shipped",
      stages: %w[design build]
    },
    {
      key: "firmware",
      label: "Firmware is in the repo if the project needs it to work",
      note: "Design stage firmware can be basic and untested",
      doc: "#{HANDBOOK}/what-makes-a-project-shipped",
      stages: %w[design build]
    },
    {
      key: "reproducible",
      label: "Someone else could build this from the repo alone",
      note: "Everything needed to recreate it is in the submission",
      doc: "#{HANDBOOK}/required-submission-fields",
      stages: %w[design build]
    },
    {
      key: "screenshot",
      label: "Cover image is a still image of the project",
      note: "No GIFs, no video files",
      doc: "#{HANDBOOK}/required-submission-fields",
      stages: %w[design build]
    },
    {
      key: "build_proof",
      label: "Build proof shows the assembled hardware working",
      note: "A demo on an allowed host — not Google Drive",
      doc: "#{HANDBOOK}/what-makes-a-project-shipped",
      stages: %w[build]
    },
    {
      key: "matches_design",
      label: "The build matches the approved design",
      note: "Any changes from the design review are explained",
      doc: nil,
      stages: %w[build]
    },
    {
      key: "journal",
      label: "Journal entries and commits account for the hours",
      note: "Incremental progress, not one dump at the end",
      doc: "#{HANDBOOK}/override-hours-spent-justification",
      stages: %w[design build]
    },
    {
      key: "hours",
      label: "Hours match the evidence, or are deflated with a reason",
      note: "A stranger following your links should reach the same number",
      doc: "#{HANDBOOK}/override-hours-spent",
      stages: %w[design build]
    },
    {
      key: "exceptions",
      label: "Not a school assignment, paid Hack Club work, or a duplicate ship",
      note: "These cannot go to the Unified DB at all",
      doc: "#{HANDBOOK}/project-exceptions",
      stages: %w[design build]
    }
  ].freeze

  def self.for_project(project)
    stage = project.build_review? ? "build" : "design"
    ITEMS.filter_map { |item| item.except(:stages) if item[:stages].include?(stage) }
  end

  def self.keys_for(project)
    for_project(project).pluck(:key)
  end

  def self.missing_for(project, checked)
    ticked = checked.is_a?(Array) ? checked.map(&:to_s) : []
    keys_for(project) - ticked
  end
end
