require "net/http"
require "cgi"

module ForgeChecks
  class Context
    IMAGE_EXTENSIONS = %w[png jpg jpeg gif webp svg bmp ico].freeze

    attr_reader :project

    def initialize(project)
      @project = project
    end

    def readme
      project.readme_cache.to_s
    end

    def readme_present?
      readme.strip.length.positive?
    end

    def readme_image_refs
      @readme_image_refs ||= begin
        md = readme.scan(/!\[[^\]]*\]\(([^)]+)\)/).flatten
        html = readme.scan(/<img\s[^>]*src=["']([^"']+)["']/).flatten
        (md + html).uniq
      end
    end

    def devlogs
      @devlogs ||= project.devlogs.order(created_at: :asc).to_a
    end

    def devlog_text
      @devlog_text ||= devlogs.map(&:content).join("\n\n")
    end

    def total_devlog_hours
      project.devlog_hours
    end

    def repo_link
      project.repo_link.to_s
    end

    def github_match
      @github_match ||= repo_link.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    end

    def gitlab_match
      @gitlab_match ||= repo_link.match(%r{gitlab\.com/([^?#]+?)(?:\.git)?(?:/-/[^?#]*)?/?(?:[?#]|$)})
    end

    def github?
      github_match.present?
    end

    def gitlab?
      gitlab_match.present?
    end

    def supported_repo?
      github? || gitlab?
    end

    def repo_tree
      return @repo_tree if defined?(@repo_tree)

      @repo_tree =
        if github?
          fetch_github_tree(github_match[1], github_match[2])
        elsif gitlab?
          fetch_gitlab_tree(gitlab_match[1])
        end
    end

    def has_file_matching?(regex)
      tree = repo_tree
      return nil unless tree

      tree.any? { |path| path.match?(regex) }
    end

    def find_files(regex)
      tree = repo_tree
      return [] unless tree

      tree.select { |path| path.match?(regex) }
    end

    def head_sha
      return nil unless github?

      default_branch = github_api("repos/#{github_match[1]}/#{github_match[2]}")&.dig("default_branch")
      return nil unless default_branch

      github_api("repos/#{github_match[1]}/#{github_match[2]}/branches/#{default_branch}")&.dig("commit", "sha")
    end

    def compare(base, head)
      return nil unless github?

      github_api("repos/#{github_match[1]}/#{github_match[2]}/compare/#{base}...#{head}")
    end

    def commit_stats
      return nil unless github?

      owner, repo = github_match[1], github_match[2]
      response = github_request("repos/#{owner}/#{repo}/commits?per_page=1")
      return nil unless response.is_a?(Net::HTTPSuccess)

      latest = Array(JSON.parse(response.body)).first
      return nil if latest.nil?

      count = last_page_number(response["link"])
      newest_at = commit_timestamp(latest)
      oldest_at =
        if count > 1
          oldest = github_api("repos/#{owner}/#{repo}/commits?per_page=1&page=#{count}")
          commit_timestamp(Array(oldest).first)
        else
          newest_at
        end

      { "count" => count, "first_at" => oldest_at, "last_at" => newest_at }
    rescue StandardError
      nil
    end

    def commit_sha_before(timestamp)
      return nil unless github? && timestamp

      iso = CGI.escape(timestamp.utc.iso8601)
      commits = github_api("repos/#{github_match[1]}/#{github_match[2]}/commits?until=#{iso}&per_page=1")
      return nil unless commits.is_a?(Array)

      commits.first&.dig("sha")
    end

    private

    def fetch_github_tree(owner, repo)
      default_branch = github_default_branch(owner, repo) || "main"
      sha = github_branch_sha(owner, repo, default_branch) || default_branch
      response = http_get("https://api.github.com/repos/#{owner}/#{repo}/git/trees/#{sha}?recursive=1")
      return nil unless response

      Array(response["tree"]).filter_map { |entry| entry["path"] if entry["type"] == "blob" }
    rescue StandardError
      nil
    end

    def github_default_branch(owner, repo)
      http_get("https://api.github.com/repos/#{owner}/#{repo}")&.dig("default_branch")
    end

    def github_branch_sha(owner, repo, branch)
      http_get("https://api.github.com/repos/#{owner}/#{repo}/branches/#{branch}")&.dig("commit", "sha")
    end

    def fetch_gitlab_tree(path)
      encoded = CGI.escape(path)
      response = http_get("https://gitlab.com/api/v4/projects/#{encoded}/repository/tree?recursive=true&per_page=100")
      return nil unless response.is_a?(Array)

      response.filter_map { |entry| entry["path"] if entry["type"] == "blob" }
    rescue StandardError
      nil
    end

    def http_get(url)
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 5
      http.read_timeout = 10
      response = http.get(uri.request_uri, "Accept" => "application/json")
      return nil unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue StandardError
      nil
    end

    def github_api(path)
      response = github_request(path)
      return nil unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue StandardError
      nil
    end

    def github_request(path)
      uri = URI("https://api.github.com/#{path}")
      req = Net::HTTP::Get.new(uri)
      req["Accept"] = "application/vnd.github+json"
      token = ENV["GITHUB_TOKEN"].to_s
      req["Authorization"] = "Bearer #{token}" if token.present?
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 10
      http.request(req)
    rescue StandardError
      nil
    end

    def last_page_number(link_header)
      match = link_header.to_s.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/)
      match ? match[1].to_i : 1
    end

    def commit_timestamp(commit)
      commit&.dig("commit", "author", "date") || commit&.dig("commit", "committer", "date")
    end
  end
end
