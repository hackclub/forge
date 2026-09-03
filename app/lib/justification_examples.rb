# Worked examples for the review UI.
#
# "i do fear the review here due to the lack of examples and the primary feeling
# of being unsure whether the reviews do actually pass" — so every BAD example
# here is a justification that was really fined, quoted from #this-is-fines,
# paired with the fine it earned and a rewrite that would have passed.
module JustificationExamples
  BAD = [
    {
      key: "checks_out",
      text: "The time is justified and checks out.",
      fine: "Justification is not valid, wdym by \"the time is justified and checks out\"",
      why: "States a conclusion and no evidence. Nothing here can be checked by anyone else.",
      fixed: "9 journal entries between Feb 3–17 totalling 12.4h, each with photos of the board at that stage. Commits track the same span (34 commits, first Feb 3, last Feb 17). Pace averages 0.7h/day with no single session over 2h, so the 12.4h is consistent with the evidence."
    },
    {
      key: "detailed",
      text: "This project is extremely detailed.",
      fine: "Demo link is not valid + justification is not sufficient for 215h, what does \"This project is extremely detailed\" mean?",
      why: "Describes the project instead of justifying the hours — and the bigger the claim, the harder this gets read.",
      fixed: "215h is claimed across 61 entries (Jan 6 – Apr 2). The scope supporting it: 4-layer PCB with USB-C PD negotiation, a custom BLE HID stack in Zephyr, and an aluminium enclosure modelled in Fusion with 9 revisions in the repo history. Timelapse covers 38h of the CAD work directly."
    },
    {
      key: "beginner",
      text: "Its a beginner project and I can justify the time - although spending 2 hours for the case may be a stretch",
      fine: "Demo link not valid - also how is this justifying the time",
      why: "Names a doubt and then approves anyway. If a part is a stretch, deflate it and say so.",
      fixed: "Beginner's first hardware project. Firmware and wiring account for 5.1h across 6 entries with photos. The 2h claimed for the printed case is not supported — the entry has no photos and the STEP file shows a single unmodified revision — so hours were deflated from 8.1h to 6.1h."
    },
    {
      key: "lgtm",
      text: "lgtm",
      fine: "lgtm is not a valid justification",
      why: "There is no reviewer in the chain after you. Whatever you did not write down did not happen.",
      fixed: "Checked all 11 entries against the commit log: entry dates match commit dates within a day throughout, every entry has a photo, and the 14.2h total matches the sum of the per-entry times. Approved at claimed hours."
    },
    {
      key: "matches_commits",
      text: "Devlogs match commits cleanly.",
      fine: "\"Devlogs match commits cleanly\" no they don't there is one (1) commit in the review window that is a filedump ! pls tell your ai to stop gaslighting me",
      why: "An assertion about the commits that nobody verified. Open the commit list and count.",
      fixed: "Commit history is thin for the hours claimed: 3 commits in the review window, the first adding 2,400 lines at once. Asked the builder for the journal photos referenced in entries 4–6 before approving; those show incremental bench work, so 11h approved with 4h deflated for the file-dump commit."
    },
    {
      key: "not_fraud",
      text: "not fraud",
      fine: "missing justification fields (no hackatime project), incomplete justification (\"not fraud\" -- what's the evidence that it's not?)",
      why: "Absence of a red flag is not evidence. Say what you looked at and what it showed.",
      fixed: "Entry timestamps are spread across 14 distinct days with photos that progress consistently (breadboard → perfboard → final PCB). No single session over 2.5h. Nothing in the pattern suggests inflation, and the physical progression in the photos cannot be faked cheaply."
    },
    {
      key: "no_deflation",
      text: "All files are present and the build looks complete.",
      fine: "no deflation was applied, despite only journals being used for tracking -- the justification is not sufficient to explain this",
      why: "Confirms the deliverables and says nothing about the hours. Journal-only tracking needs the hours addressed explicitly.",
      fixed: "Journal-only tracking, so hours were scrutinised rather than taken at face value. 7 entries, 18.5h claimed. Entries 3 and 5 (6h combined) describe writing up earlier work rather than building, so those were deflated to 2h. Approved at 14.5h."
    }
  ].freeze

  # The shape a passing justification has, in the order the fines ask for it.
  ANATOMY = [
    { part: "Time evidence", detail: "How many entries, over what date range, totalling what — plus what the commits show over the same window." },
    { part: "Scope", detail: "The specific technical work that accounts for the hours. Features, not the project's title." },
    { part: "The arithmetic", detail: "Hours claimed, hours approved, and what drove the difference. If nothing was deflated, say why none was warranted." },
    { part: "Verifiability", detail: "Links a stranger can follow to reach your number without asking you anything." }
  ].freeze

  def self.for_project(project)
    {
      "anatomy" => ANATOMY.map { |a| { "part" => a[:part], "detail" => a[:detail] } },
      "examples" => BAD.map { |b| b.transform_keys(&:to_s) },
      "journal_only" => project.devlog_mode.to_s != "git"
    }
  end
end
