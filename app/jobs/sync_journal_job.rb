class SyncJournalJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find(project_id)
    return unless project.repo_link.present?

    parsed = parse_repo_url(project.repo_link)
    return unless parsed

    journal_content = fetch_journal(parsed[:owner], parsed[:repo])
    return unless journal_content.present?

    entries = parse_journal_entries(journal_content)
    return if entries.empty?

    entries.each do |entry|
      existing = project.devlogs.find_by(title: entry[:title])
      next if existing

      project.devlogs.create!(
        title: entry[:title],
        content: entry[:content],
        time_spent: entry[:time_spent]
      )
    end
  end

  private

  def parse_repo_url(url)
    match = url.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    match ? { owner: match[1], repo: match[2] } : nil
  end

  def fetch_journal(owner, repo)
    uri = URI("https://api.github.com/repos/#{owner}/#{repo}/contents/JOURNAL.md")
    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["content"]

    Base64.decode64(data["content"]).force_encoding("UTF-8")
  rescue StandardError => e
    Rails.logger.error("Failed to fetch JOURNAL.md: #{e.message}")
    nil
  end

  def parse_journal_entries(content)
    content_without_frontmatter = content.sub(/\A---\s*\n.*?\n---\s*\n/m, "")

    chunks = content_without_frontmatter.split(/^# /).reject(&:blank?)

    chunks.filter_map do |chunk|
      lines = chunk.strip.split("\n")
      title_line = lines.first&.strip
      next if title_line.blank?

      body = lines[1..].join("\n").strip

      time_match = body.match(/\*\*Total time spent:\s*(.+?)\*\*/i) ||
                   body.match(/Time spent:\s*(.+)/i)
      time_spent = time_match ? time_match[1].strip : nil

      {
        title: title_line,
        content: body,
        time_spent: time_spent
      }
    end
  end
end
