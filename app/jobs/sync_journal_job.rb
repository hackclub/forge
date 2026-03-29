class SyncJournalJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find(project_id)
    return unless project.repo_link.present?

    parsed = parse_repo_url(project.repo_link)
    return unless parsed

    journal_content = fetch_journal(parsed)
    return unless journal_content.present?

    entries = parse_journal_entries(journal_content)

    if entries.empty?
      entries = parse_with_ai(journal_content)
    end

    return if entries.empty?

    raw_base = build_raw_base(parsed)

    entries.each do |entry|
      existing = Devlog.where(project_id: project.id, title: entry[:title]).exists?
      next if existing

      content = rewrite_image_urls(entry[:content], raw_base)
      content = "No content" if content.blank?

      devlog = Devlog.new(
        project_id: project.id,
        title: entry[:title],
        content: content,
        time_spent: entry[:time_spent]
      )
      if devlog.save
        Rails.logger.info("SyncJournal: created devlog '#{entry[:title]}' with time_spent=#{entry[:time_spent]}")
      else
        Rails.logger.error("SyncJournal: failed to create devlog '#{entry[:title]}': #{devlog.errors.full_messages}")
      end
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

  def fetch_journal(parsed)
    case parsed[:host]
    when "github"
      fetch_github_file(parsed[:owner], parsed[:repo], "JOURNAL.md")
    when "gitlab"
      fetch_gitlab_file(parsed[:owner], parsed[:repo], "JOURNAL.md")
    when "codeberg"
      fetch_codeberg_file(parsed[:owner], parsed[:repo], "JOURNAL.md")
    end
  end

  def fetch_github_file(owner, repo, path)
    uri = URI("https://api.github.com/repos/#{owner}/#{repo}/contents/#{path}")
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["content"]

    Base64.decode64(data["content"]).force_encoding("UTF-8")
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from GitHub: #{e.message}")
    nil
  end

  def fetch_gitlab_file(owner, repo, path)
    project_id = URI.encode_www_form_component("#{owner}/#{repo}")
    uri = URI("https://gitlab.com/api/v4/projects/#{project_id}/repository/files/#{URI.encode_www_form_component(path)}/raw?ref=main")
    response = Net::HTTP.get_response(uri)
    return response.body.force_encoding("UTF-8") if response.is_a?(Net::HTTPSuccess)

    nil
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from GitLab: #{e.message}")
    nil
  end

  def fetch_codeberg_file(owner, repo, path)
    uri = URI("https://codeberg.org/api/v1/repos/#{owner}/#{repo}/contents/#{path}")
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["content"]

    Base64.decode64(data["content"]).force_encoding("UTF-8")
  rescue StandardError => e
    Rails.logger.error("Failed to fetch from Codeberg: #{e.message}")
    nil
  end

  def build_raw_base(parsed)
    case parsed[:host]
    when "github"
      "https://raw.githubusercontent.com/#{parsed[:owner]}/#{parsed[:repo]}/main/"
    when "gitlab"
      "https://gitlab.com/#{parsed[:owner]}/#{parsed[:repo]}/-/raw/main/"
    when "codeberg"
      "https://codeberg.org/#{parsed[:owner]}/#{parsed[:repo]}/raw/branch/main/"
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
