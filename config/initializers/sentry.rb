# frozen_string_literal: true

Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]

  config.send_default_pii = true
  config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", 0.1).to_f
  config.profiles_sample_rate = ENV.fetch("SENTRY_PROFILES_SAMPLE_RATE", 0.1).to_f

  config.excluded_exceptions += [ "ActionController::RoutingError" ]

  config.environment = Rails.env.staging? ? "staging" : Rails.env
end
