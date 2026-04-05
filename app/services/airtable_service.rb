require "faraday"
require "json"

module AirtableService
  class Error < StandardError; end

  module_function

  def api_key
    ENV.fetch("AIRTABLE_API_KEY", nil)
  end

  def base_id
    ENV.fetch("AIRTABLE_BASE_ID", nil)
  end

  def default_table
    ENV.fetch("AIRTABLE_TABLE_ID", nil) || ENV.fetch("AIRTABLE_TABLE_NAME", "YSWS Project Submission")
  end

  def enabled?
    api_key.present? && base_id.present?
  end

  def upsert_by_forge_id(forge_id, fields, table: default_table)
    return unless enabled?

    existing = find_by_forge_id(forge_id, table: table)
    if existing
      update_record(existing["id"], fields, table: table)
    else
      create_record(fields.merge("Forge Project ID" => forge_id.to_s), table: table)
    end
  end

  def find_by_forge_id(forge_id, table: default_table)
    return nil unless enabled?

    response = connection.get("/v0/#{base_id}/#{CGI.escape(table)}") do |req|
      req.headers["Authorization"] = "Bearer #{api_key}"
      req.params["filterByFormula"] = "{Forge Project ID} = '#{forge_id}'"
      req.params["maxRecords"] = 1
    end

    unless response.success?
      Rails.logger.error("Airtable find failed: #{response.status} - #{response.body}")
      return nil
    end

    JSON.parse(response.body)["records"]&.first
  rescue StandardError => e
    Rails.logger.error("Airtable find error: #{e.class}: #{e.message}")
    nil
  end

  def create_record(fields, table: default_table)
    return nil unless enabled?

    response = connection.post("/v0/#{base_id}/#{CGI.escape(table)}") do |req|
      req.headers["Authorization"] = "Bearer #{api_key}"
      req.headers["Content-Type"] = "application/json"
      req.body = { fields: fields, typecast: true }.to_json
    end

    unless response.success?
      Rails.logger.error("Airtable create failed: #{response.status} - #{response.body}")
      return nil
    end

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("Airtable create error: #{e.class}: #{e.message}")
    nil
  end

  def update_record(record_id, fields, table: default_table)
    return nil unless enabled?

    response = connection.patch("/v0/#{base_id}/#{CGI.escape(table)}/#{record_id}") do |req|
      req.headers["Authorization"] = "Bearer #{api_key}"
      req.headers["Content-Type"] = "application/json"
      req.body = { fields: fields, typecast: true }.to_json
    end

    unless response.success?
      Rails.logger.error("Airtable update failed: #{response.status} - #{response.body}")
      return nil
    end

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("Airtable update error: #{e.class}: #{e.message}")
    nil
  end

  def connection
    @connection ||= Faraday.new(url: "https://api.airtable.com")
  end
end
