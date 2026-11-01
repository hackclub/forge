module SporkProps
  extend ActiveSupport::Concern

  private

  def spork_check_props(check)
    return nil unless check

    {
      verdict: check.verdict,
      hit: check.hit?,
      repo: check.repo,
      match_count: check.match_count,
      results: check.results,
      screen_errors: check.screen_errors,
      error_message: check.error_message,
      checked_at: check.checked_at&.strftime("%b %d, %Y %H:%M"),
      innocent: spork_innocent_props(check),
      checking: spork_checking_props(check)
    }
  end

  def spork_check_summary_props(check)
    return nil unless check

    top_matches = check.results.flat_map { |r| r["matches"].to_a.map { |m| m.slice("repo", "url", "containment").merge("mode" => r["mode"]) } }
    {
      verdict: check.verdict,
      match_count: check.match_count,
      top_matches: top_matches.sort_by { |m| -m["containment"].to_f }.first(3),
      error_message: check.error_message,
      checked_at: check.checked_at&.strftime("%b %d, %Y %H:%M"),
      innocent: spork_innocent_props(check),
      checking: spork_checking_props(check)
    }
  end

  def spork_innocent_props(check)
    return nil unless check.innocent?

    {
      by: check.innocent_by&.display_name,
      at: check.innocent_at.strftime("%b %d, %Y %H:%M"),
      note: check.innocent_note
    }
  end

  def spork_checking_props(check)
    return nil unless check.checking?

    {
      by: check.checking_by&.display_name,
      at: check.checking_at.strftime("%b %d, %Y %H:%M"),
      mine: check.checking_by_id == current_user&.id
    }
  end
end
