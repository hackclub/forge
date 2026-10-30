require "faraday"
require "json"

module SporkService
  class ScreenError < StandardError
    attr_reader :status

    def initialize(message, status: nil)
      super(message)
      @status = status
    end
  end

  class RetryableError < ScreenError; end

  module_function

  BASE_URL = "https://telescreen.hackclub.com".freeze
  API_KEY_SETTING = "spork_api_key".freeze
  RETRYABLE_STATUSES = [ 429, 502, 503 ].freeze
  VERDICT_PRIORITY = %w[exclusive_match shared_template clear no_design_files].freeze
  MAX_MATCHES = 20

  def api_key
    AppSetting.get(API_KEY_SETTING).presence || ENV["HACKATIME_ADMIN_API_KEY"].presence
  end

  def enabled?
    api_key.present?
  end

  def repo_slug(url)
    match = url.to_s.match(%r{github\.com/([A-Za-z0-9._-]{1,100})/([A-Za-z0-9._-]{1,100})}i)
    return nil unless match

    "#{match[1]}/#{match[2].sub(/\.git\z/i, '')}"
  end

  def screen(repo, store: true)
    raise ScreenError, "Spork is not configured." unless enabled?

    response = connection.post("/api/workbench/spork/screen") do |req|
      req.headers["Authorization"] = "Bearer #{api_key}"
      req.body = { url: repo, mode: "auto", store: store }.to_json
    end
    body = parse(response.body)
    return summarize(body) if response.success?

    message = body.is_a?(Hash) ? body["message"].presence || body["statusMessage"].presence : nil
    error_class = RETRYABLE_STATUSES.include?(response.status) ? RetryableError : ScreenError
    raise error_class.new(message || "Spork returned #{response.status}.", status: response.status)
  rescue Faraday::Error => e
    raise RetryableError, "Spork request failed: #{e.message}"
  end

  def summarize(body)
    results = body["mode"] == "auto" ? Array(body["results"]) : [ body ]
    errors = body["mode"] == "auto" ? Array(body["errors"]) : []
    verdicts = results.map { |r| r["verdict"] }

    {
      verdict: VERDICT_PRIORITY.find { |v| verdicts.include?(v) } || "failed",
      match_count: results.sum { |r| r["matchCount"].to_i },
      results: results.map { |r| compact_result(r) },
      screen_errors: errors.map { |e| e.slice("mode", "statusCode", "message") }
    }
  end

  def test_connection!(token_override = nil)
    key = token_override.presence || api_key
    raise "No Spork key configured." if key.blank?

    response = connection.get("/api/workbench/spork/progress") do |req|
      req.headers["Authorization"] = "Bearer #{key}"
    end
    raise "Spork rejected the key (#{response.status}). Needs a Hackatime admin key." unless response.success?
  end

  def compact_result(result)
    matches = Array(result["matches"]).sort_by { |m| -m["containment"].to_f }.first(MAX_MATCHES)

    {
      "mode" => result["mode"],
      "verdict" => result["verdict"],
      "verdict_label" => result["verdictLabel"],
      "verdict_meaning" => result["verdictMeaning"],
      "match_count" => result["matchCount"].to_i,
      "corpus_size" => result["sporkRepos"],
      "files" => result.dig("source", "files"),
      "caveat" => result["caveat"],
      "matches" => matches.map { |m| compact_match(m) }
    }
  end

  def compact_match(match)
    evidence = Array(match["blockDetail"]).sort_by { |b| -b["containment"].to_f }.first(3)

    {
      "repo" => match["repo"],
      "url" => match["url"],
      "containment" => match["containment"].to_f,
      "evidence" => evidence.map { |b| { "label" => b["label"], "strength" => b["strength"] } }
    }
  end

  def parse(body)
    JSON.parse(body.to_s)
  rescue JSON::ParserError
    nil
  end

  def connection
    @connection = nil if Rails.env.test?
    @connection ||= Faraday.new(url: BASE_URL) do |f|
      f.headers["Content-Type"] = "application/json"
      f.adapter Faraday.default_adapter
      f.options.timeout = 300
      f.options.open_timeout = 10
    end
  end
end
