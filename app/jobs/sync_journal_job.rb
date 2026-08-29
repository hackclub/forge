class SyncJournalJob < ApplicationJob
  queue_as :default

  AUTO_SYNC_INTERVAL = 10.minutes

  def self.sync_if_stale(project)
    return unless project&.devlog_mode == "git"
    return if project.repo_link.blank?
    return if project.journal_synced_at.present? && project.journal_synced_at > AUTO_SYNC_INTERVAL.ago

    project.update_columns(journal_synced_at: Time.current)
    perform_later(project.id)
  end

  def perform(project_id)
    project = Project.find(project_id)
    project.update_columns(journal_synced_at: Time.current)
    return unless project.repo_link.present?

    parsed = parse_repo_url(project.repo_link)
    return unless parsed

    branch = project.journal_branch.presence

    journal_content = fetch_journal(parsed, branch)
    return unless journal_content.present?

    entries = parse_journal_entries(journal_content)

    if entries.empty?
      entries = parse_with_ai(journal_content)
    end

    return if entries.empty?

    raw_base = build_raw_base(parsed, branch)
    author = project.user
    today = author&.today_in_zone || Date.current
    zone = author&.timezone.presence || "UTC"
    fallback_date = nil

    entries.each do |entry|
      content = rewrite_image_urls(entry[:content], raw_base)
      content = "No content" if content.blank?

      devlog = Devlog.where(project_id: project.id, title: entry[:title]).first
      parsed_date = extract_entry_date(entry, today)

      if devlog
        devlog.content = content
        devlog.time_spent = entry[:time_spent]
        devlog.time_hours = TimeSpentParser.parse(entry[:time_spent])
        devlog.entry_date = parsed_date if parsed_date
      else
        fallback_date ||= journal_commit_date(parsed, branch, today, zone) || today
        devlog = Devlog.new(
          project_id: project.id,
          title: entry[:title],
          content: content,
          time_spent: entry[:time_spent],
          time_hours: TimeSpentParser.parse(entry[:time_spent]),
          entry_date: parsed_date || fallback_date
        )
      end

      next unless devlog.changed?

      if devlog.save
        Rails.logger.info("SyncJournal: synced devlog '#{entry[:title]}' for #{devlog.entry_date} with time_spent=#{entry[:time_spent]}, time_hours=#{devlog.time_hours}")
      else
        Rails.logger.error("SyncJournal: failed to save devlog '#{entry[:title]}': #{devlog.errors.full_messages}")
      end
    end

    author&.apply_streak_freezes!
  end

  private

  def parse_repo_url(url)
    match = url.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    return { host: "github", owner: match[1], repo: match[2] } if match

    match = url.match(%r{gitlab\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    return { host: "gitlab", owner: match[1], repo: match[2] } if match

    match = url.match(%r{codeberg\.org/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    return { host: "codeberg", owner: match[1], repo: match[2] } if match

    nil
  end

  def fetch_journal(parsed, branch)
    case parsed[:host]
    when "github"
      fetch_github_file(parsed[:owner], parsed[:repo], "JOURNAL.md", branch)
    when "gitlab"
      fetch_gitlab_file(parsed[:owner], parsed[:repo], "JOURNAL.md", branch)
    when "codeberg"
      fetch_codeberg_file(parsed[:owner], parsed[:repo], "JOURNAL.md", branch)
    end
  end

  def fetch_github_file(owner, repo, path, branch)
    uri = URI("https://api.github.com/repos/#{owner}/#{repo}/contents/#{path}")
    uri.query = URI.encode_www_form(ref: branch) if branch.present?
    req = Net::HTTP::Get.new(uri)
    token = ENV["GITHUB_TOKEN"].to_s
    req["Authorization"] = "Bearer #{token}" if token.present?
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    response = http.request(req)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["content"]

    Base64.decode64(data["content"]).force_encoding("UTF-8")
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from GitHub: #{e.message}")
    nil
  end

  def fetch_gitlab_file(owner, repo, path, branch)
    project_id = URI.encode_www_form_component("#{owner}/#{repo}")
    ref = branch.presence || "main"
    uri = URI("https://gitlab.com/api/v4/projects/#{project_id}/repository/files/#{URI.encode_www_form_component(path)}/raw?ref=#{URI.encode_www_form_component(ref)}")
    response = Net::HTTP.get_response(uri)
    return response.body.force_encoding("UTF-8") if response.is_a?(Net::HTTPSuccess)

    nil
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from GitLab: #{e.message}")
    nil
  end

  def fetch_codeberg_file(owner, repo, path, branch)
    uri = URI("https://codeberg.org/api/v1/repos/#{owner}/#{repo}/contents/#{path}")
    uri.query = URI.encode_www_form(ref: branch) if branch.present?
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["content"]

    Base64.decode64(data["content"]).force_encoding("UTF-8")
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from Codeberg: #{e.message}")
    nil
  end

  def build_raw_base(parsed, branch)
    ref = branch.presence || "main"
    case parsed[:host]
    when "github"
      "https://raw.githubusercontent.com/#{parsed[:owner]}/#{parsed[:repo]}/#{ref}/"
    when "gitlab"
      "https://gitlab.com/#{parsed[:owner]}/#{parsed[:repo]}/-/raw/#{ref}/"
    when "codeberg"
      "https://codeberg.org/#{parsed[:owner]}/#{parsed[:repo]}/raw/branch/#{ref}/"
    else
      ""
    end
  end

  def rewrite_image_urls(content, raw_base)
    return content if raw_base.blank?

    content.gsub(/!\[([^\]]*)\]\(\.\/([^)]+)\)/) do
      alt = $1
      path = $2
      "![#{alt}](#{raw_base}#{path})"
    end.gsub(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/) do
      alt = $1
      path = $2
      "![#{alt}](#{raw_base}#{path})"
    end
  end

  MONTH_NAMES = (Date::MONTHNAMES.compact + Date::ABBR_MONTHNAMES.compact).map(&:downcase).uniq.freeze
  MONTH_ALTERNATION = MONTH_NAMES.join("|").freeze
  ISO_DATE_PATTERN = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.freeze
  DAY_FIRST_PATTERN = Regexp.new("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(#{MONTH_ALTERNATION})\\b\\.?(?:[\\s,]+(\\d{4}))?", Regexp::IGNORECASE).freeze
  MONTH_FIRST_PATTERN = Regexp.new("\\b(#{MONTH_ALTERNATION})\\b\\.?\\s+(\\d{1,2})(?:[\\s,]+(\\d{4}))?", Regexp::IGNORECASE).freeze
  DATE_LINE_PATTERN = /^.*\bdate\b.*$/i

  # An explicit "Date:" line wins over prose, and "16 July" is read day-first
  # before "July 16" is tried — otherwise a day-first entry matches the month
  # and takes the clock time that follows it as the day.
  def extract_entry_date(entry, today = Date.current)
    sources = [ entry[:content].to_s[DATE_LINE_PATTERN], "#{entry[:title]} #{entry[:content]}" ].compact

    sources.each do |source|
      if (m = source.match(ISO_DATE_PATTERN))
        return build_safe_date(m[1].to_i, m[2].to_i, m[3].to_i, today)
      end

      if (m = source.match(DAY_FIRST_PATTERN))
        month = month_number(m[2])
        return build_safe_date(m[3]&.to_i || today.year, month, m[1].to_i, today) if month
      end

      if (m = source.match(MONTH_FIRST_PATTERN))
        month = month_number(m[1])
        return build_safe_date(m[3]&.to_i || today.year, month, m[2].to_i, today) if month
      end
    end

    nil
  end

  def month_number(name)
    name = name.downcase
    Date::MONTHNAMES.index { |n| n&.downcase == name } ||
      Date::ABBR_MONTHNAMES.index { |n| n&.downcase == name }
  end

  def build_safe_date(year, month, day, today = Date.current)
    date = Date.new(year, month, day)
    return nil if date > today + 1
    return nil if date < today - 2.years
    date = today if date > today

    date
  rescue Date::Error, ArgumentError
    nil
  end

  # Undated entries are credited to the day JOURNAL.md was last pushed, read in
  # the author's timezone so a post-midnight commit isn't filed under yesterday.
  def journal_commit_date(parsed, branch, today, zone)
    timestamp = case parsed[:host]
    when "github" then last_commit_timestamp("https://api.github.com/repos/#{parsed[:owner]}/#{parsed[:repo]}/commits", { path: "JOURNAL.md", per_page: 1, sha: branch }, %w[commit committer date])
    when "gitlab" then last_commit_timestamp("https://gitlab.com/api/v4/projects/#{URI.encode_www_form_component("#{parsed[:owner]}/#{parsed[:repo]}")}/repository/commits", { path: "JOURNAL.md", per_page: 1, ref_name: branch }, %w[committed_date])
    when "codeberg" then last_commit_timestamp("https://codeberg.org/api/v1/repos/#{parsed[:owner]}/#{parsed[:repo]}/commits", { path: "JOURNAL.md", limit: 1, sha: branch }, %w[commit committer date])
    end
    return nil if timestamp.blank?

    date = Time.zone.parse(timestamp)&.in_time_zone(zone)&.to_date
    return nil if date.nil?

    [ date, today ].min
  rescue StandardError => e
    Rails.logger.warn("SyncJournal: commit date lookup failed: #{e.message}")
    nil
  end

  def last_commit_timestamp(url, query, path)
    uri = URI(url)
    uri.query = URI.encode_www_form(query.compact.reject { |_, v| v.blank? })
    req = Net::HTTP::Get.new(uri)
    token = ENV["GITHUB_TOKEN"].to_s
    req["Authorization"] = "Bearer #{token}" if token.present? && uri.host == "api.github.com"

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 10
    response = http.request(req)
    return nil unless response.is_a?(Net::HTTPSuccess)

    commits = JSON.parse(response.body)
    return nil unless commits.is_a?(Array) && commits.first.is_a?(Hash)

    commits.first.dig(*path)
  end

  HEADER_PATTERN = /^(\#+)\s+(.+)$/

  # Journals don't agree on which heading level marks a new entry: some use a
  # single "#" per day, others use "#" only as a document title with "##" per
  # day (and "###" for sub-notes within a day). We infer the entry level as
  # the shallowest heading level that repeats — a level used only once is
  # more likely a one-off document title than a recurring entry marker.
  # Only "#" or "##" may ever serve as the entry boundary; deeper headings
  # (###+) are always treated as sub-content, never as entry separators.
  ENTRY_LEVELS = [ 1, 2 ].freeze

  def detect_entry_level(content)
    counts = Hash.new(0)
    content.scan(HEADER_PATTERN) { |hashes, _title| counts[hashes.length] += 1 }
    counts = counts.slice(*ENTRY_LEVELS)
    return 1 if counts.empty?

    repeated = counts.select { |_level, count| count >= 2 }.keys
    repeated.any? ? repeated.min : counts.keys.min
  end

  def parse_journal_entries(content)
    content_without_frontmatter = content.sub(/\A---\s*\n.*?\n---\s*\n/m, "")
    entry_level = detect_entry_level(content_without_frontmatter)

    entries = []
    current_title = nil
    current_body = []

    content_without_frontmatter.lines.each do |line|
      if (m = line.match(HEADER_PATTERN))
        if m[1].length == entry_level
          if current_title
            entry = build_entry(current_title, current_body.join)
            entries << entry if entry
          end
          current_title = m[2].strip
          current_body = []
        else
          current_body << line if current_title
        end
      else
        current_body << line if current_title
      end
    end

    if current_title
      entry = build_entry(current_title, current_body.join)
      entries << entry if entry
    end

    entries
  end

  def build_entry(title, body)
    return nil if title.blank?
    return nil if title.match?(/\A(TOTAL|More|---)/i)
    return nil if title.strip.match?(/\A\#{1,3}\z/)
    return nil if title.strip.length < 3

    body = body.to_s.strip
    time_match = body.match(/\*\*Total time spent:\s*(.+?)\*\*/i) ||
                 body.match(/Time spent:\s*(.+)/i) ||
                 title.match(/\(([\d.]+\s*(?:hrs?|hours?|mins?))\b/i)
    time_spent = time_match ? time_match[1].strip : nil

    {
      title: title,
      content: body,
      time_spent: time_spent
    }
  end

  def parse_with_ai(content)
    prompt = <<~PROMPT
      Parse this JOURNAL.md file into individual devlog entries. Each entry should have a date/title, the content, and time spent.

      Journal content:
      #{content.truncate(4000)}

      Respond in valid JSON only, no markdown fences:
      [{"title": "entry title with date", "content": "the entry content", "time_spent": "time if mentioned or null"}]
    PROMPT

    response = Net::HTTP.post(
      URI("https://ai.hackclub.com/proxy/v1/chat/completions"),
      { model: "qwen/qwen3-32b", messages: [ { role: "user", content: prompt } ] }.to_json,
      "Content-Type" => "application/json",
      "Authorization" => "Bearer #{ENV['HACKCLUB_AI_API_KEY']}"
    )

    if response.is_a?(Net::HTTPSuccess)
      ai_content = JSON.parse(response.body).dig("choices", 0, "message", "content") || ""
      json_match = ai_content.match(/\[[\s\S]*\]/)
      if json_match
        data = JSON.parse(json_match[0])
        return data.filter_map do |entry|
          next if entry["title"].blank?
          {
            title: entry["title"],
            content: entry["content"] || "",
            time_spent: entry["time_spent"]
          }
        end
      end
    end

    []
  rescue StandardError => e
    Rails.logger.error("AI journal parsing failed: #{e.message}")
    []
  end
end
