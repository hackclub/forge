class TimeSpentParser
  # Parse time spent strings into decimal hours
  # Returns nil if parsing fails (entry flagged for manual review)
  # Tries patterns in order:
  # - "6h35", "6 hours 35 minutes"
  # - "6:35"
  # - "6h", "6.5 hours", "6 hours"
  # - "30 minutes", "30 mins"
  # - plain number (assumed as hours)

  def self.parse(time_spent_string)    return nil if time_spent_string.to_s.strip.empty?
    value = time_spent_string.to_s.strip.downcase

    # Pattern 1: Hours and minutes together, e.g. "6h35", "6 hours 35 minutes", "6 hours, 35 minutes"
    # Matches: "6h35", "6 h 35 m", "6hours35minutes", "6 hours, 35 minutes", etc.
    if match = value.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*[,\s]*(\d+(?:\.\d+)?)\s*m?(?:in(?:utes?)?)?/)
      hours = match[1].to_f
      minutes = match[2].to_f
      return (hours + minutes / 60.0).round(2)
    end

    # Pattern 2: Colon format, e.g. "6:35"
    if match = value.match(/^(\d+):(\d+)$/)
      hours = match[1].to_i
      minutes = match[2].to_i
      return (hours + minutes / 60.0).round(2)
    end

    # Pattern 3: Hours only, e.g. "6h", "6.5 hours"
    if match = value.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/)
      return match[1].to_f.round(2)
    end

    # Pattern 4: Minutes only, e.g. "30 minutes", "30 mins", "30m"
    if match = value.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?/)
      minutes = match[1].to_f
      return (minutes / 60.0).round(2)
    end

    # Pattern 5: Plain number fallback (assumed as hours)
    if value.match?(/^\d+(?:\.\d+)?$/)
      return value.to_f.round(2)
    end

    # No pattern matched - return nil to flag for manual review
    nil
  end
end
