require "net/http"

module ForgeChecks
  # 73 fines were broken or invalid playable/demo URLs, and seven of Forge's own
  # nineteen were "not a valid demo link" — the second-biggest thing we get
  # fined for. A reviewer clicking the link at review time is not enough,
  # because the fines show links that were already dead on submission.
  class PlayableUrlReachable < Base
    def self.label = "Build proof link opens for a stranger"
    def self.source = "submitting.md"

    # Hosts and shapes the fines rejected outright.
    DISALLOWED = {
      /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i => "a localhost address, which only works on your machine",
      %r{drive\.google\.com|docs\.google\.com}i => "Google Drive, which is not an allowed host",
      %r{\Afile://|\A[a-z]:\\|\A/(?:Users|home)/}i => "a file path on your computer, not a URL",
      %r{streamlit\.app}i => "Streamlit, which is not an allowed host",
      %r{github\.dev|codespaces}i => "a GitHub Codespace, which nobody else can open",
      %r{onshape\.com}i => "an Onshape link — these are private by default, so link your repo README instead"
    }.freeze

    BARE_MEDIA = /\.(mov|mp4|avi|mkv|mts|m4v)(\?|#|$)/i

    def call
      url = ctx.project.build_proof_url.to_s.strip
      return skipped("No build proof link on this project yet.") if url.blank?

      DISALLOWED.each do |pattern, why|
        return fail!("Your build proof link points at #{why}. Fixing this before review avoids a fine.") if url.match?(pattern)
      end

      if url.match?(BARE_MEDIA)
        return fail!("Your build proof link is a raw video file. Upload it somewhere it plays in a browser — several fines were issued for unplayable video files.")
      end

      case reachability(url)
      when :ok          then pass("Build proof link responded successfully.")
      when :not_found   then fail!("Your build proof link returns a 404. Fix or replace it — a dead link is an automatic fine.")
      when :auth_walled then fail!("Your build proof link asks for a login. It has to open for someone who is not signed in.")
      when :error       then uncertain("Your build proof link returned an error. Open it in a private window and check it works.")
      else                   uncertain("Couldn't reach your build proof link automatically — please confirm it opens in a private window.")
      end
    end

    private

    def reachability(url)
      uri = URI.parse(url)
      return :unknown unless uri.is_a?(URI::HTTP) && uri.host.present?

      response = request(uri)
      return :unknown if response.nil?

      case response.code.to_i
      when 200..299 then :ok
      when 401, 403 then :auth_walled
      when 404, 410 then :not_found
      when 300..399 then redirect_target(response, uri)
      else :error
      end
    rescue StandardError
      :unknown
    end

    def redirect_target(response, uri)
      location = response["location"].to_s
      return :auth_walled if location.match?(/login|signin|sign-in|auth|accounts\./i)

      target = begin
        URI.join(uri, location)
      rescue StandardError
        nil
      end
      return :unknown if target.nil?

      inner = request(target)
      inner && inner.code.to_i.between?(200, 299) ? :ok : :unknown
    end

    def request(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 5
      http.read_timeout = 8
      path = uri.request_uri.presence || "/"
      response = http.head(path, "User-Agent" => "ForgeChecks/1.0")
      # Plenty of hosts refuse HEAD; fall back to a GET before believing them.
      response = http.get(path, "User-Agent" => "ForgeChecks/1.0") if response.code.to_i >= 400
      response
    rescue StandardError
      nil
    end
  end
end
