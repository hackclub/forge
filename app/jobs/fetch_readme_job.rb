class FetchReadmeJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find_by(id: project_id)
    return unless project&.repo_link.present?

    parsed = project.repo_link.match(%r{github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/|$)})
    return unless parsed

    owner = parsed[1]
    repo = parsed[2]

    response = Net::HTTP.get_response(URI("https://api.github.com/repos/#{owner}/#{repo}/readme"))
    return unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return unless data["content"]

    content = Base64.decode64(data["content"]).force_encoding("UTF-8")
    default_branch = data["target"] || fetch_default_branch(owner, repo) || "main"
    content = rewrite_relative_urls(content, owner, repo, default_branch)
    content = upload_images_to_cdn(content)
    project.update!(readme_cache: content, readme_fetched_at: Time.current)
  rescue StandardError => e
    Rails.logger.error("FetchReadmeJob failed: #{e.class}: #{e.message}")
  end

  private

  def fetch_default_branch(owner, repo)
    response = Net::HTTP.get_response(URI("https://api.github.com/repos/#{owner}/#{repo}"))
    return nil unless response.is_a?(Net::HTTPSuccess)
    JSON.parse(response.body)["default_branch"]
  rescue StandardError
    nil
  end

  def rewrite_relative_urls(content, owner, repo, branch)
    raw_base = "https://raw.githubusercontent.com/#{owner}/#{repo}/#{branch}"
    content
      .gsub(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/) { "![#{$1}](#{raw_base}/#{$2})" }
      .gsub(/<img\s([^>]*?)src=["'](?!https?:\/\/)([^"']+)["']/) { "<img #{$1}src=\"#{raw_base}/#{$2}\"" }
  end

  def upload_images_to_cdn(content)
    return content unless HcCdnService.enabled?

    content = content.gsub(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/) do
      alt, url = $1, $2
      cdn_url = HcCdnService.mirror(url)
      "![#{alt}](#{cdn_url || url})"
    end

    content.gsub(/<img\s([^>]*?)src=["'](https?:\/\/[^"']+)["']/) do
      attrs, url = $1, $2
      cdn_url = HcCdnService.mirror(url)
      "<img #{attrs}src=\"#{cdn_url || url}\""
    end
  end
end
