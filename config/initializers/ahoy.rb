class Ahoy::Store < Ahoy::DatabaseStore
  def track_visit(data)
    data[:ip] = request.headers["CF-Connecting-IP"] || request.remote_ip
    data[:utm_source] ||= request.params["ref"] if request.params["ref"].present?
    super(data)
  end
end

Ahoy.api = false
Ahoy.visit_duration = 4.hours
Ahoy.cookie_domain = :all
Ahoy.cookies = :none
Ahoy.geocode = true
Ahoy.job_queue = :default
