class FetchReadmeJob < ApplicationJob
  queue_as :default

  README_CANDIDATES = %w[README.md readme.md README.MD Readme.md README.markdown README.rst README.txt README].freeze
  OPEN_TIMEOUT = 5
  READ_TIMEOUT = 10
  # Cap how many README images we mirror to the CDN in one pass so a wildly
  # image-heavy README can't tie a worker up for minutes.
  MAX_MIRRORED_IMAGES = 25

  # mirror: false fetches and caches the raw README text only, skipping the
  # per-image CDN round-trips. The AI pre-submission check uses this path — it
  # only needs the README text, and the mirroring is slow enough on image-heavy
  # repos to stall the check. Image mirroring still runs on the default path.
  def perform(project_id, mirror: true)
    project = Project.find_by(id: project_id)
    return unless project&.repo_link.present?

    result =
      if (m = project.repo_link.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)}))
        fetch_github(m[1], m[2])
      elsif (m = project.repo_link.match(%r{gitlab\.com/([^?#]+?)(?:\.git)?(?:/-/[^?#]*)?/?(?:[?#]|$)}))
        fetch_gitlab(m[1].chomp("/"))
      end
    return unless result

    content = mirror ? upload_images_to_cdn(result[:content]) : result[:content]
    project.update!(readme_cache: content, readme_fetched_at: Time.current)
  rescue StandardError => e
    Rails.logger.error("FetchReadmeJob failed: #{e.class}: #{e.message}")
  end

  private

  def get_response(url)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = OPEN_TIMEOUT
    http.read_timeout = READ_TIMEOUT
    http.get(uri.request_uri)
  end

  def fetch_github(owner, repo)
    response = get_response("https://api.github.com/repos/#{owner}/#{repo}/readme")
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    raw = data["content"]
    return nil unless raw

    content = Base64.decode64(raw).force_encoding("UTF-8")
    branch = data["target"] || fetch_github_default_branch(owner, repo) || "main"
    raw_base = "https://raw.githubusercontent.com/#{owner}/#{repo}/#{branch}"
    { content: rewrite_relative_urls(content, raw_base) }
  end

  def fetch_github_default_branch(owner, repo)
    response = get_response("https://api.github.com/repos/#{owner}/#{repo}")
    return nil unless response.is_a?(Net::HTTPSuccess)
    JSON.parse(response.body)["default_branch"]
  rescue StandardError
    nil
  end

  def fetch_gitlab(path)
    encoded = CGI.escape(path)
    info = gitlab_get_json("https://gitlab.com/api/v4/projects/#{encoded}")
    return nil unless info

    branch = info["default_branch"] || "main"
    README_CANDIDATES.each do |name|
      url = "https://gitlab.com/api/v4/projects/#{encoded}/repository/files/#{CGI.escape(name)}/raw?ref=#{CGI.escape(branch)}"
      response = get_response(url)
      next unless response.is_a?(Net::HTTPSuccess)

      raw_base = "https://gitlab.com/#{path}/-/raw/#{branch}"
      return { content: rewrite_relative_urls(response.body.force_encoding("UTF-8"), raw_base) }
    end
    nil
  end

  def gitlab_get_json(url)
    response = get_response(url)
    return nil unless response.is_a?(Net::HTTPSuccess)
    JSON.parse(response.body)
  rescue StandardError
    nil
  end

  def rewrite_relative_urls(content, raw_base)
    content
      .gsub(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/) { "![#{$1}](#{raw_base}/#{$2})" }
      .gsub(/<img\s([^>]*?)src=["'](?!https?:\/\/)([^"']+)["']/) { "<img #{$1}src=\"#{raw_base}/#{$2}\"" }
  end

  def upload_images_to_cdn(content)
    return content unless HcCdnService.enabled?

    mirrored = 0
    mirror_one = lambda do |url|
      return url if mirrored >= MAX_MIRRORED_IMAGES
      mirrored += 1
      HcCdnService.mirror(url) || url
    end

    content = content.gsub(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/) do
      alt, url = $1, $2
      "![#{alt}](#{mirror_one.call(url)})"
    end

    content.gsub(/<img\s([^>]*?)src=["'](https?:\/\/[^"']+)["']/) do
      attrs, url = $1, $2
      "<img #{attrs}src=\"#{mirror_one.call(url)}\""
    end
  end
end
