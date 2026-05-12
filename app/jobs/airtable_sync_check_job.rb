class AirtableSyncCheckJob < ApplicationJob
  queue_as :background

  CACHE_KEY = "admin/airtable_sync/drift"
  CACHE_TTL = 30.minutes

  def perform
    return unless AirtableService.enabled?

    approved_ids = Project.kept.where(status: :approved).pluck(:id).to_set
    airtable_ids = fetch_airtable_forge_ids

    missing_from_airtable = approved_ids - airtable_ids
    orphan_in_airtable = airtable_ids - approved_ids

    Rails.cache.write(CACHE_KEY, {
      checked_at: Time.current.iso8601,
      missing_from_airtable: missing_from_airtable.to_a.sort,
      orphan_in_airtable: orphan_in_airtable.to_a.sort,
      approved_count: approved_ids.size,
      airtable_count: airtable_ids.size
    }, expires_in: CACHE_TTL)
  end

  private

  def fetch_airtable_forge_ids
    table = AirtableService.default_table
    base_id = AirtableService.base_id
    api_key = AirtableService.api_key
    ids = []
    offset = nil
    loop do
      response = Faraday.new(url: "https://api.airtable.com").get("/v0/#{base_id}/#{CGI.escape(table)}") do |req|
        req.headers["Authorization"] = "Bearer #{api_key}"
        req.params["fields[]"] = "Forge Project ID"
        req.params["pageSize"] = 100
        req.params["offset"] = offset if offset
      end
      break unless response.success?

      body = JSON.parse(response.body)
      records = body["records"] || []
      records.each do |rec|
        forge_id = rec.dig("fields", "Forge Project ID")
        next if forge_id.blank?

        ids << forge_id.to_i
      end
      offset = body["offset"]
      break unless offset
    end
    ids.to_set
  end
end
