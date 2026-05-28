class SyncJournalJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find(project_id)
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
    dates_to_credit = []

    entries.each do |entry|
      existing = Devlog.where(project_id: project.id, title: entry[:title]).exists?
      next if existing

      content = rewrite_image_urls(entry[:content], raw_base)
      content = "No content" if content.blank?

      devlog = Devlog.new(
        project_id: project.id,
        title: entry[:title],
        content: content,
        time_spent: entry[:time_spent],
        time_hours: TimeSpentParser.parse(entry[:time_spent])
      )
      if devlog.save
        Rails.logger.info("SyncJournal: created devlog '#{entry[:title]}' with time_spent=#{entry[:time_spent]}, time_hours=#{devlog.time_hours}")
        if (entry_date = extract_entry_date(entry))
          dates_to_credit << entry_date
        end
      else
        Rails.logger.error("SyncJournal: failed to create devlog '#{entry[:title]}': #{devlog.errors.full_messages}")
      end
    end

    dates_to_credit.uniq.sort.each do |date|
      project.user.record_activity!(date)
    end
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
    response = Net::HTTP.get_response(uri)
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
  MONTH_PATTERN = Regexp.new("\\b(#{MONTH_NAMES.join('|')})\\b", Regexp::IGNORECASE).freeze
  ISO_DATE_PATTERN = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.freeze

  def extract_entry_date(entry)
    source = "#{entry[:title]} #{entry[:content]}"

    if (m = source.match(ISO_DATE_PATTERN))
      return build_safe_date(m[1].to_i, m[2].to_i, m[3].to_i)
    end

    if (m = source.match(/#{MONTH_PATTERN}\.?\s+(\d{1,2})(?:[\s,]+(\d{4}))?/))
      month_name = m[1].downcase
      month = Date::MONTHNAMES.index { |n| n&.downcase == month_name } ||
              Date::ABBR_MONTHNAMES.index { |n| n&.downcase == month_name }
      return nil unless month

      day = m[2].to_i
      year = m[3]&.to_i || Date.current.year
      return build_safe_date(year, month, day)
    end

    nil
  end

  def build_safe_date(year, month, day)
    date = Date.new(year, month, day)
    return nil if date > Date.current + 1
    return nil if date < 2.years.ago.to_date

    date
  rescue Date::Error, ArgumentError
    nil
  end

  HEADER_PATTERN = /^(\#{1,3})\s+(.+)$/

  def parse_journal_entries(content)
    content_without_frontmatter = content.sub(/\A---\s*\n.*?\n---\s*\n/m, "")

    entries = []
    current_title = nil
    current_body = []

    content_without_frontmatter.lines.each do |line|
      if (m = line.match(HEADER_PATTERN))
        if current_title
          entry = build_entry(current_title, current_body.join)
          entries << entry if entry
        end
        current_title = m[2].strip
        current_body = []
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
