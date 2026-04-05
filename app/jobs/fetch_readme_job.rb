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
    project.update!(readme_cache: content, readme_fetched_at: Time.current)
  rescue StandardError => e
    Rails.logger.error("FetchReadmeJob failed: #{e.class}: #{e.message}")
  end
end
