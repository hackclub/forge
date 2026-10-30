class SporkLookupJob < ApplicationJob
  queue_as :default

  def self.cache_key(user_id, token)
    "admin/spork/lookup/#{user_id}/#{token}"
  end

  def perform(user_id, token, query)
    result = begin
      { status: "done", repo: query, **SporkService.screen(query, store: false) }
    rescue SporkService::ScreenError => e
      { status: "error", repo: query, message: e.message }
    rescue StandardError => e
      Rails.logger.error("SporkLookupJob failed for #{query}: #{e.class}: #{e.message}")
      { status: "error", repo: query, message: "Spork lookup failed." }
    end

    Rails.cache.write(self.class.cache_key(user_id, token), result, expires_in: 1.hour)
  end
end
