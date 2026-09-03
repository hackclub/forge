require "test_helper"

# Every "fined" case below is a justification that really was fined, quoted from
# #this-is-fines. If one of these stops being blocked, Forge is exposed again.
class JustificationLintTest < ActiveSupport::TestCase
  GOOD_ASSESSMENT = <<~TEXT.strip
    9 journal entries between Feb 3 and Feb 17 totalling 12.4h, each with photos of the
    board at that stage. The commit log covers the same span (34 commits, first Feb 3,
    last Feb 17). Pace averages 0.7h/day with no single session over 2h.
  TEXT
  GOOD_TECHNICAL = "custom ESP32 PCB with USB-C charging, CAD case in Fusion, PID motor firmware"

  def lint(**overrides)
    JustificationLint.run(**{
      assessment: GOOD_ASSESSMENT,
      technical_features: GOOD_TECHNICAL,
      evidence: "https://forge.hackclub.com/projects/1#devlog-2",
      claimed_hours: 12.4,
      approved_hours: 12.4
    }.merge(overrides))
  end

  test "a specific, numbered, linked justification passes" do
    assert_empty lint
  end

  test "blocks the justifications Forge was actually fined for" do
    fined = [
      "The time is justified and checks out",
      "lgtm",
      "This project is extremely detailed",
      "no reason",
      "not fraud",
      "Devlogs match commits cleanly",
      "it is evident effort was put into this",
      "N/A"
    ]
    fined.each do |text|
      issues = lint(assessment: text)
      assert JustificationLint.blocking?(issues), "expected #{text.inspect} to be blocked"
    end
  end

  test "blocks praise aimed at the builder rather than an internal record" do
    issues = lint(assessment: "#{GOOD_ASSESSMENT} Great job, keep it up!")
    assert_includes issues.map(&:code), "builder_addressed"
    assert JustificationLint.blocking?(issues)
  end

  test "blocks a bare hour count" do
    issues = lint(assessment: "12.4 hours")
    assert_includes issues.map(&:code), "hours_only"
  end

  test "blocks a justification with no citable evidence" do
    issues = lint(assessment: "The scope of this build is consistent with roughly 12 hours of bench work on the enclosure and board.")
    assert_includes issues.map(&:code), "no_evidence_cited"
  end

  test "blocks deflation with no real reason" do
    issues = lint(approved_hours: 6.0, deflation_reason: "too much")
    assert_includes issues.map(&:code), "deflation_unexplained"
    assert JustificationLint.blocking?(issues)
  end

  test "accepts deflation with a substantive reason" do
    issues = lint(approved_hours: 6.0,
                  deflation_reason: "Entries 3 and 5 describe writing up earlier work, not building, so 6.4h was removed.")
    assert_not JustificationLint.blocking?(issues)
  end

  test "blocks approval of an AI project that never mentions the AI" do
    issues = lint(uses_ai: true, approved_hours: 8.0,
                  deflation_reason: "Deflated for the AI-authored firmware, which was one prompt.")
    assert_includes issues.map(&:code), "ai_undisclosed"
  end

  test "accepts an AI project whose justification addresses the AI" do
    issues = lint(
      uses_ai: true,
      approved_hours: 8.0,
      assessment: "#{GOOD_ASSESSMENT} Roughly a third of the firmware is Claude-authored, so those 4.4h were deflated.",
      deflation_reason: "AI-authored firmware deflated to one third of tracked time."
    )
    assert_not JustificationLint.blocking?(issues)
  end

  test "requires lapse time to be addressed when timelapses exist" do
    issues = lint(has_lapse: true)
    assert_includes issues.map(&:code), "lapse_unaddressed"
  end

  test "accepts a justification that accounts for the lapse" do
    issues = lint(
      has_lapse: true,
      assessment: "#{GOOD_ASSESSMENT} The 3h lapse is fully on-task bench work; no deflation needed."
    )
    assert_not JustificationLint.blocking?(issues)
  end

  test "requires red flags to be addressed in the extra-context field" do
    issues = lint(red_flags: [ "Single commit file dump" ])
    assert_includes issues.map(&:code), "red_flags_unaddressed"

    cleared = lint(red_flags: [ "Single commit file dump" ],
                   additional: "The file dump is the vendored Zephyr tree; the actual work is in the 30 later commits.")
    assert_not_includes cleared.map(&:code), "red_flags_unaddressed"
  end

  test "warns rather than blocks on a thin justification for a large claim" do
    issues = JustificationLint.run(
      assessment: GOOD_ASSESSMENT, technical_features: GOOD_TECHNICAL,
      evidence: "https://x/y", claimed_hours: 215, approved_hours: 215
    )
    assert_includes issues.map(&:code), "high_hours_thin"
    assert_not JustificationLint.blocking?(issues)
  end

  test "rules payload is valid JavaScript regex source" do
    payload = JustificationLint.rules_payload
    assert_operator payload["empty_assertions"].size, :>, 10
    (payload["empty_assertions"] + payload["placeholders"] + payload["builder_addressed"]).each do |rule|
      assert_not_includes rule["source"], '\A', "\\A has no JS equivalent"
      assert_not_includes rule["source"], '\z', "\\z has no JS equivalent"
    end
  end
end
