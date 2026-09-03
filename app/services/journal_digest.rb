# Condenses a project's journal into something a reviewer can audit in a couple
# of minutes instead of half an hour.
#
# Reviewers said the read-every-entry slog is what stops them reviewing at all:
# "it often takes me 25-30 to look through the proj", "The length of time it
# takes, especially for projects with 50+ journals". So rather than asking them
# to trust a summary, this surfaces the things the fines say actually matter —
# pace, gaps, backfilled entries, hour outliers, missing evidence — with a link
# straight to any entry worth opening.
module JournalDigest
  module_function

  OUTLIER_HOURS = 8.0
  GAP_DAYS = 7
  # Many entries written on one day about many different days is the "transferring
  # devlogs" pattern the fines require deflation for.
  BACKFILL_MIN_ENTRIES = 3

  def build(project)
    entries = project.devlogs.reorder(entry_date: :asc, created_at: :asc).to_a
    return { "entry_count" => 0, "weeks" => [], "signals" => [], "total_hours" => 0.0 } if entries.empty?

    weeks = group_by_week(entries)
    {
      "entry_count" => entries.size,
      "total_hours" => entries.sum { |e| e.parsed_hours.to_f }.round(1),
      "first_entry_on" => date_of(entries.first)&.to_s,
      "last_entry_on" => date_of(entries.last)&.to_s,
      "span_days" => span_days(entries),
      "with_images" => entries.count { |e| image?(e) },
      "with_lapse" => entries.count { |e| e.lapse_url.present? },
      "weeks" => weeks,
      "signals" => signals(entries, weeks)
    }
  end

  def group_by_week(entries)
    entries.group_by { |e| (date_of(e) || e.created_at.to_date).beginning_of_week }
           .sort_by(&:first)
           .map do |monday, group|
      {
        "week_of" => monday.to_s,
        "label" => "#{monday.strftime('%b %-d')} – #{(monday + 6).strftime('%b %-d')}",
        "entries" => group.size,
        "hours" => group.sum { |e| e.parsed_hours.to_f }.round(1),
        "with_images" => group.count { |e| image?(e) },
        "lapse_urls" => group.filter_map { |e| e.lapse_url.presence }.uniq,
        "items" => group.map { |e| item(e) }
      }
    end
  end

  def item(entry)
    {
      "id" => entry.id,
      "title" => entry.title.to_s.truncate(90),
      "entry_date" => date_of(entry)&.to_s,
      "hours" => entry.parsed_hours.to_f.round(2),
      "chars" => entry.content.to_s.strip.length,
      "has_image" => image?(entry),
      "lapse_url" => entry.lapse_url.presence,
      "written_on" => entry.created_at.to_date.to_s,
      "backfilled" => backfilled?(entry),
      "outlier" => entry.parsed_hours.to_f > OUTLIER_HOURS
    }
  end

  # Each signal is a reason to look closer, phrased as the thing a reviewer
  # would otherwise have to notice by hand — and each maps to a real fine.
  def signals(entries, weeks)
    out = []

    outliers = entries.select { |e| e.parsed_hours.to_f > OUTLIER_HOURS }
    if outliers.any?
      out << signal("hour_outliers", "warn",
                    "#{outliers.size} entr#{outliers.size == 1 ? 'y claims' : 'ies claim'} more than #{OUTLIER_HOURS.to_i}h in one sitting (largest: #{outliers.map { |e| e.parsed_hours.to_f }.max.round(1)}h).",
                    "Single long sessions were fined where the entry did not say what was accomplished.",
                    outliers.map(&:id))
    end

    backfilled = entries.select { |e| backfilled?(e) }
    if backfilled.size >= BACKFILL_MIN_ENTRIES
      out << signal("backfilled", "warn",
                    "#{backfilled.size} entries were written well after the day they describe.",
                    "Time spent writing or transferring journals has to be deflated — Forge has been fined for approving it at full value.",
                    backfilled.first(10).map(&:id))
    end

    if (gaps = gap_ranges(entries)).any?
      out << signal("gaps", "info",
                    "#{gaps.size} gap#{'s' if gaps.size != 1} of #{GAP_DAYS}+ days with no entries (#{gaps.first(3).join(', ')}).",
                    "Long silences with a big hour claim on either side are worth a look.",
                    [])
    end

    thin = entries.select { |e| e.content.to_s.strip.length < 120 && e.parsed_hours.to_f >= 2 }
    if thin.any?
      out << signal("thin_entries", "warn",
                    "#{thin.size} entr#{thin.size == 1 ? 'y claims' : 'ies claim'} 2h+ in under 120 characters.",
                    '"the devlogs do not say anything about what was accomplished during the time they tracked" was a fine.',
                    thin.first(10).map(&:id))
    end

    no_image = entries.count { |e| !image?(e) }
    if no_image.positive? && no_image > entries.size / 2
      out << signal("few_images", "info",
                    "#{no_image} of #{entries.size} entries have no image.",
                    "Journal-only tracking with no visual progress raises the evidence bar for the hours.",
                    [])
    end

    busiest = weeks.max_by { |w| w["hours"] }
    if busiest && busiest["hours"] > 40
      out << signal("dense_week", "info",
                    "#{busiest['hours']}h claimed in the week of #{busiest['label']}.",
                    "Worth confirming that week's entries individually.",
                    [])
    end

    out
  end

  def signal(code, level, headline, why, entry_ids)
    { "code" => code, "level" => level, "headline" => headline, "why" => why, "entry_ids" => entry_ids }
  end

  def gap_ranges(entries)
    dates = entries.filter_map { |e| date_of(e) }.uniq.sort
    dates.each_cons(2).filter_map do |a, b|
      next if (b - a).to_i < GAP_DAYS

      "#{a.strftime('%b %-d')}→#{b.strftime('%b %-d')}"
    end
  end

  def backfilled?(entry)
    on = date_of(entry)
    return false if on.nil?

    (entry.created_at.to_date - on).to_i > 3
  end

  def image?(entry)
    entry.content.to_s.match?(/!\[[^\]]*\]\([^)]+\)|<img\s/i)
  end

  def date_of(entry)
    entry.entry_date || entry.created_at&.to_date
  end

  def span_days(entries)
    first = date_of(entries.first)
    last = date_of(entries.last)
    return 0 if first.nil? || last.nil?

    (last - first).to_i + 1
  end
end
