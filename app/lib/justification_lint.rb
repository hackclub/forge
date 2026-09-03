# Static checks on an Override Hours Spent Justification, derived from the
# ~700 real fines issued in #this-is-fines. Every rule here maps to a fine we
# (or another program) actually received; `fine` carries the wording of the
# fine so a reviewer can see the consequence, not just the complaint.
#
# Runs with no network and no AI so it can drive the review UI live on every
# keystroke. AiRequirementsChecker#check_justification is the slower second
# opinion, not a replacement for this.
class JustificationLint
  Issue = Struct.new(:field, :code, :severity, :message, :fine, keyword_init: true) do
    def to_h
      { "field" => field.to_s, "code" => code.to_s, "severity" => severity.to_s,
        "message" => message.to_s, "fine" => fine.to_s }
    end

    def blocking? = severity.to_s == "block"
  end

  # Phrases that got a Forge or sibling-program justification fined for saying
  # nothing. Matched case-insensitively against the whole justification.
  EMPTY_ASSERTIONS = [
    [ /\bchecks?\s+out\b/i,
      'Fined for exactly this: "Justification is not valid, wdym by \'the time is justified and checks out\'"' ],
    [ /\blgtm\b/i, '"lgtm is not a valid justification"' ],
    [ /\blooks?\s+(good|fine|solid|legit|okay|ok)\b/i,
      '"please add more detail to the justification -- what makes the demo and repository look solid?"' ],
    [ /\breasonable\s+(time|times|hours|amount)\b/i,
      '"Again demo link not valid + please add more specifics when you say \'reasonable times\'"' ],
    [ /\b(extremely|very|super)\s+(detailed|complex|impressive)\b/i,
      '"justification is not sufficient for 215h, what does \'This project is extremely detailed\' mean?"' ],
    [ /\beffort\s+was\s+put\b/i,
      '"\'it is evident effort was put\' doesn\'t tell me anything: what is the evidence you\'re referring to?"' ],
    [ /\bit\s+is\s+evident\b/i,
      '"what is the evidence you\'re referring to? that\'s what i would want to see in the justification"' ],
    [ /\bnot\s+fraud\b/i,
      '"incomplete justification (\'not fraud\' -- what\'s the evidence that it\'s not?)"' ],
    [ /\bno\s+reason\b/i, '"\'no reason\' isn\'t a valid justification"' ],
    [ /\b(seems?|looks?)\s+(fine|right|correct|accurate)\b/i,
      '"Justification seems incomplete?" — an impression is not evidence' ],
    [ /\b(a\s+little\s+lacking|lacking\s+info)\b/i,
      '"what does \'a little lacking\' mean and why aren\'t the other sections lacking?"' ],
    [ /\breadme\s+is\s+good\b/i,
      '"\'readme is good\' doesn\'t really tell me anything, please elaborate on what makes it good"' ],
    [ /\bmatch(es)?\s+(the\s+)?(commit|commits|commit history)\b(?!.{0,80}?(because|specific|\d))/i,
      '"\'Devlogs match commits cleanly\' no they don\'t there is one (1) commit in the review window that is a filedump"' ],
    [ /\b(up\s+to\s+you|prob(ably)?\s+reject|not\s+sure\s+if)\b/i,
      '"Do not approve stuff if you are not sure \'would prob reject but it\'s up to you.\'"' ],
    [ /\bthe\s+time\s+is\s+justified\b/i,
      '"Justification is not valid, wdym by \'the time is justified and checks out\'"' ]
  ].freeze

  # Justifications are an internal record for a stranger auditing the DB, not a
  # message to the builder. Several fines called this out directly.
  BUILDER_ADDRESSED = [
    /\b(great|awesome|amazing|nice)\s+(job|work|project)\b/i,
    /\bkeep\s+(it\s+up|going)\b/i,
    /\bcongrat/i,
    /\bwell\s+done\b/i,
    /\byou'?(ve|r)\s+(did|done|made)\b/i
  ].freeze

  PLACEHOLDERS = [ /\A\s*n\/?a\s*\z/i, /\A\s*none\s*\z/i, /\A\s*-+\s*\z/, /\A\s*\.\s*\z/ ].freeze

  # Words that describe the project rather than justify the hours. A
  # justification made only of these is the single most-fined Forge failure.
  EVIDENCE_MARKERS = /\b(journal|journals|devlog|devlogs|commit|commits|lapse|timelapse|entr(y|ies)|hackatime|https?:\/\/)\b/i

  MIN_ASSESSMENT_CHARS = 120
  MIN_TECHNICAL_CHARS  = 40

  class << self
    def run(time_summary: nil, technical_features: nil, evidence: nil, assessment: nil,
            additional: nil, deflation_reason: nil, claimed_hours: 0, approved_hours: 0,
            journal_only: false, uses_ai: false, has_lapse: false, red_flags: [])
      issues = []
      assessment = assessment.to_s
      technical  = technical_features.to_s
      deflation  = (claimed_hours.to_f - approved_hours.to_f).round(1)
      deflation  = 0.0 if deflation.negative?

      issues.concat(empty_assertion_issues(:assessment, assessment))
      issues.concat(empty_assertion_issues(:technical_features, technical))
      issues.concat(builder_addressed_issues(assessment))
      issues.concat(assessment_issues(assessment, claimed_hours))
      issues.concat(technical_issues(technical))
      issues.concat(evidence_issues(evidence, time_summary))
      issues.concat(deflation_issues(deflation, deflation_reason, journal_only, additional))
      issues.concat(ai_disclosure_issues(uses_ai, assessment, additional, deflation))
      issues.concat(lapse_issues(has_lapse, assessment, additional, deflation))
      issues.concat(red_flag_issues(red_flags, additional))

      issues.uniq { |i| [ i.field, i.code ] }
    end

    def blocking?(issues) = issues.any?(&:blocking?)

    # The rule table, serialized for the review UI so it can lint on every
    # keystroke without a round trip. Ruby stays the single source of truth:
    # this method and #run read the same constants, and the server re-runs #run
    # on submit so a client that ignores the hints still cannot approve.
    def rules_payload
      {
        "empty_assertions" => EMPTY_ASSERTIONS.map { |pattern, fine|
          { "source" => js_source(pattern), "flags" => "i", "fine" => fine }
        },
        "builder_addressed" => BUILDER_ADDRESSED.map { |p| { "source" => js_source(p), "flags" => "i" } },
        "placeholders" => PLACEHOLDERS.map { |p| { "source" => js_source(p), "flags" => "i" } },
        "evidence_markers" => { "source" => js_source(EVIDENCE_MARKERS), "flags" => "i" },
        "min_assessment_chars" => MIN_ASSESSMENT_CHARS,
        "min_technical_chars" => MIN_TECHNICAL_CHARS
      }
    end

    private

    # Ruby's \\A and \\z have no JS equivalent; everything else in these
    # patterns is shared syntax.
    def js_source(pattern)
      pattern.source.gsub('\\A', "^").gsub('\\z', "$").gsub('\\Z', "$")
    end

    def issue(field, code, severity, message, fine = nil)
      Issue.new(field: field, code: code, severity: severity, message: message, fine: fine)
    end

    def empty_assertion_issues(field, text)
      return [] if text.blank?

      EMPTY_ASSERTIONS.filter_map do |pattern, fine|
        next unless text.match?(pattern)

        phrase = text[pattern].to_s.strip
        issue(field, "empty_assertion:#{phrase.downcase.gsub(/\s+/, '_')}", "block",
              %(“#{phrase}” asserts a conclusion without evidence — say what you checked and what it showed.), fine)
      end
    end

    def builder_addressed_issues(text)
      return [] if text.blank?
      return [] unless BUILDER_ADDRESSED.any? { |p| text.match?(p) }

      [ issue(:assessment, "builder_addressed", "block",
              "This reads as a message to the builder. The justification is an internal record for whoever audits the Unified DB — put encouragement in the feedback field instead.",
              '"Factual internal record — NOT encouragement, praise, or a message addressed to the submitter"') ]
    end

    def assessment_issues(text, claimed_hours)
      return [ issue(:assessment, "missing", "block", "No justification written.", '"No justification"') ] if text.strip.blank?

      out = []
      if PLACEHOLDERS.any? { |p| text.match?(p) }
        out << issue(:assessment, "placeholder", "block", "A placeholder is not a justification.",
                     '"\"N/A\" isn\'t a valid playable URL" / "(none provided)"')
      end
      if text.strip.match?(/\A[\d.\s hrshours]+\z/i)
        out << issue(:assessment, "hours_only", "block",
                     "This is just a number. Explain why the work is worth that number.",
                     '"the justification is just the number of hours"')
      end
      if text.strip.length < MIN_ASSESSMENT_CHARS
        out << issue(:assessment, "too_short", "block",
                     "Too short to be checkable (#{text.strip.length} of #{MIN_ASSESSMENT_CHARS} characters). A stranger has to reach your conclusion from what you wrote.",
                     '"Please properly review this, there\'s no link to journals and justification is vague and makes me thing that there\'s nothing backing up the hours"')
      end
      unless text.match?(EVIDENCE_MARKERS)
        out << issue(:assessment, "no_evidence_cited", "block",
                     "Cite the actual evidence — journal entries, commits, or timelapse links. Right now nothing here can be independently checked.",
                     '"inflation above what hackatime tracks requires more evidence than just vaguely citing \'the code\'"')
      end
      unless text.match?(/\d/)
        out << issue(:assessment, "no_numbers", "block",
                     "No numbers anywhere. Reference the hours, the entry count, or the date range so the figure is traceable.",
                     '"Justification doesn\'t explain why x project deserves x hours, be more specific"')
      end
      if claimed_hours.to_f >= 40 && text.strip.length < 300
        out << issue(:assessment, "high_hours_thin", "warn",
                     "#{claimed_hours.to_f.round(1)}h is a large claim — high-hour projects get read closely, so spell out the scope that supports it.",
                     '"justification is not sufficient for 215h, what does \'This project is extremely detailed\' mean?"')
      end
      out
    end

    def technical_issues(text)
      return [ issue(:technical_features, "missing", "block",
                     "List the specific technical features that account for the hours.",
                     '"needs hackatime project name and specific technical features"') ] if text.strip.blank?

      out = []
      if text.strip.length < MIN_TECHNICAL_CHARS
        out << issue(:technical_features, "too_short", "block",
                     "Name concrete implementation work, not a summary (#{text.strip.length} of #{MIN_TECHNICAL_CHARS} characters).",
                     '"CAD paint brush holder is not a technical feature, it\'s the title of the project"')
      end
      out
    end

    def evidence_issues(evidence, time_summary)
      out = []
      if evidence.to_s.strip.blank? && time_summary.to_s.strip.blank?
        out << issue(:evidence, "no_links", "warn",
                     "No supporting links. Paste the journal entries you relied on — reviewers get fined for justifications a stranger cannot follow.",
                     '"There\'s no journal link" / "Add journal links to the justification please"')
      end
      out
    end

    def deflation_issues(deflation, reason, journal_only, additional)
      out = []
      if deflation > 0 && reason.to_s.strip.length < 15
        out << issue(:override, "deflation_unexplained", "block",
                     "#{deflation}h deflated with no real reason recorded. State what evidence drove the number.",
                     '"the justification should specify what the hours were before and after deflation and what specific evidence was used for deflation"')
      end
      if journal_only && deflation.zero?
        out << issue(:override, "journal_only_no_deflation", "warn",
                     "Only journals being used to track it. Please make sure you are deflating accuratley as not deflating enough can get us fined!",
                     '"no deflation was applied, despite only journals being used for tracking -- the justification is not sufficient to explain this"')
      end
      out
    end

    # The handbook requires Lapse links plus, for coding lapses, "a short
    # explanation of on-task time and what deflation was applied". Forge has been
    # fined twice for approving lapse time spent writing journals at full value.
    def lapse_issues(has_lapse, assessment, additional, deflation)
      return [] unless has_lapse

      combined = "#{assessment} #{additional}"
      out = []
      unless combined.match?(/lapse|timelapse|on.?task/i)
        out << issue(:assessment, "lapse_unaddressed", "block",
                     "This project has timelapse evidence, which the handbook requires you to address: say how much of the lapse was on-task and what deflation you applied.",
                     '"some time in lapse (writing devlogs/transferring devlogs from beest) needs to be deflated, but no deflation was applied"')
      end
      if deflation.zero? && combined.match?(/lapse/i) && !combined.match?(/no deflation|none needed|fully on.?task|entirely on.?task/i)
        out << issue(:override, "lapse_no_deflation", "warn",
                     "Lapse time approved in full. If all of it was on-task, say so explicitly — the handbook treats silence here as non-compliant.",
                     '"lapse recording is not valid as they are mostly just using ai to write the description and just testing the project"')
      end
      out
    end

    # "Additional Justification — required when the submission has suspicious
    # characteristics or needs extra context for spot-check confidence."
    def red_flag_issues(red_flags, additional)
      flags = Array(red_flags).reject(&:blank?)
      return [] if flags.empty?
      return [] if additional.to_s.strip.length >= 40

      [ issue(:assessment, "red_flags_unaddressed", "block",
              "Forge flagged #{flags.size} thing#{'s' if flags.size != 1} on this project (#{flags.first(3).join('; ')}). The handbook requires extra justification when a submission has suspicious characteristics — address it in the extra-context field.",
              '"Additional Justification — required when the submission has suspicious characteristics"') ]
    end

    def ai_disclosure_issues(uses_ai, assessment, additional, deflation)
      return [] unless uses_ai

      combined = "#{assessment} #{additional}"
      out = []
      unless combined.match?(/\bai\b|\bllm\b|claude|chatgpt|copilot|cursor|generated/i)
        out << issue(:assessment, "ai_undisclosed", "block",
                     "The builder declared AI use but the justification never addresses it. Say how much is AI-authored and how you handled it.",
                     '"please deflate hours for excessive AI use unacknowledged by review"')
      end
      if deflation.zero?
        out << issue(:override, "ai_no_deflation", "warn",
                     "AI-assisted project approved at full hours. Programs are fined routinely for this — deflate or justify the exception explicitly.",
                     '"ai coding heartbeats need to be deflated to max 1/3"')
      end
      out
    end
  end
end
