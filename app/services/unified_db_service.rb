require "faraday"
require "json"

# Read-only lookups against the YSWS Unified Database.
#
# Double-dipping is the single largest fine category in #this-is-fines (164 of
# 700), and four of Forge's own nineteen fines were repos already submitted to
# Blueprint or Stasis. Every one of those was discoverable before approval by
# searching the unified table for the Code URL, which is what this does.
#
# The base and table ids are the ones the fine messages themselves link to.
module UnifiedDbService
  # Raised when the lookup could not be performed. Distinct from an empty
  # result: "we checked and found nothing" and "we could not check" must not be
  # treated the same, or a transient Airtable outage silently reads as clear.
  class LookupError < StandardError; end

  module_function

  PAT_SETTING   = "unified_db_pat".freeze
  DEFAULT_BASE  = "app3A5kJwYqxMLOgh".freeze
  DEFAULT_TABLE = "tblzWWGUYHVH7Zyqf".freeze

  # Real field names, read off the unified table's schema. Airtable rejects an
  # entire filterByFormula if it references even one unknown field, so guessing
  # is not a safe fallback here — an earlier version of this listed plausible
  # names like "code_url" and every lookup 422'd. Candidates are intersected
  # with the live schema before they reach a formula.
  CODE_URL_FIELDS = [ "Code URL", "Archive - Code URL" ].freeze
  # "YSWS" is a linked-record field and returns record ids, so the readable
  # name fields come first. Note the en-dash in "YSWS–Name".
  PROGRAM_FIELDS  = [ "YSWS–Name", "YSWS Name - Lookup", "YSWS" ].freeze
  HOURS_FIELDS    = [ "Override Hours Spent", "Hours Spent" ].freeze
  FIRST_NAME_FIELD = "First Name".freeze
  LAST_NAME_FIELD  = "Last Name".freeze
  EMAIL_FIELDS    = [ "Email", "Email - Trimmed & Lowercased" ].freeze
  CREATED_FIELDS  = [ "Created", "Approved At" ].freeze
  # There is no Status column; approval is recorded as a timestamp.
  APPROVED_AT_FIELD = "Approved At".freeze
  DUPLICATE_JUSTIFICATION_FIELD = "Override Duplicate Justification".freeze

  def pat
    AppSetting.get(PAT_SETTING).presence || ENV["UNIFIED_DB_PAT"].presence
  end

  def base_id
    ENV["UNIFIED_DB_BASE_ID"].presence || DEFAULT_BASE
  end

  def table_id
    ENV["UNIFIED_DB_TABLE_ID"].presence || DEFAULT_TABLE
  end

  def enabled?
    pat.present?
  end

  # "https://github.com/Owner/Repo.git/tree/main" -> "owner/repo"
  #
  # Matching on the owner/repo slug rather than the full URL is deliberate: the
  # dupes in the fines differed only by .git suffix, trailing slash, casing, or
  # a /tree/<branch> path.
  def repo_slug(url)
    match = url.to_s.match(%r{(?:github|gitlab)\.com/([^/\s]+)/([^/\s?#]+)}i)
    return nil unless match

    owner = match[1]
    repo  = match[2].sub(/\.git\z/i, "")
    return nil if owner.blank? || repo.blank?

    "#{owner}/#{repo}".downcase
  end

  # Records in the unified DB whose Code URL points at the same repo.
  # Raises LookupError if the query could not be run.
  def records_for_repo(url, limit: 10)
    slug = repo_slug(url)
    return [] if slug.blank? || !enabled?

    fields = usable_code_url_fields
    if fields.empty?
      raise LookupError, "No recognisable Code URL field on the unified table (looked for #{CODE_URL_FIELDS.join(', ')})"
    end

    formula = "OR(#{fields.map { |f| %(FIND("#{slug}", LOWER({#{f}} & ""))) }.join(', ')})"
    fetch(formula, limit).map { |record| normalize(record) }
  end

  def fetch(formula, limit)
    response = connection.get("/v0/#{base_id}/#{table_id}") do |req|
      req.headers["Authorization"] = "Bearer #{pat}"
      req.params["filterByFormula"] = formula
      req.params["maxRecords"] = limit
    end

    unless response.success?
      Rails.logger.error("UnifiedDbService query failed: #{response.status} - #{response.body.to_s[0, 300]}")
      raise LookupError, "Unified DB returned #{response.status}"
    end

    Array(JSON.parse(response.body)["records"])
  rescue LookupError
    raise
  rescue StandardError => e
    Rails.logger.error("UnifiedDbService.fetch failed: #{e.class}: #{e.message}")
    raise LookupError, "Unified DB lookup failed (#{e.class})"
  end

  # The table's live field names, so a formula only ever references real columns.
  # Cached because the schema changes far less often than reviews happen.
  def field_names
    return [] unless enabled?

    Rails.cache.fetch([ "unified_db", "field_names", "v1", base_id, table_id ], expires_in: 12.hours) do
      fetch_field_names
    end || []
  end

  def fetch_field_names
    response = connection.get("/v0/meta/bases/#{base_id}/tables") do |req|
      req.headers["Authorization"] = "Bearer #{pat}"
    end

    unless response.success?
      # schema.bases:read may not be granted; sampling a record still reveals
      # the names of every field that has a value on it.
      Rails.logger.warn("UnifiedDbService schema read failed (#{response.status}) — sampling a record instead")
      return sample_field_names
    end

    table = Array(JSON.parse(response.body)["tables"]).find { |t| t["id"] == table_id || t["name"] == table_id }
    return sample_field_names if table.nil?

    Array(table["fields"]).filter_map { |f| f["name"] }
  rescue StandardError => e
    Rails.logger.warn("UnifiedDbService.fetch_field_names failed: #{e.class}: #{e.message}")
    sample_field_names
  end

  def sample_field_names
    response = connection.get("/v0/#{base_id}/#{table_id}") do |req|
      req.headers["Authorization"] = "Bearer #{pat}"
      req.params["maxRecords"] = 1
    end
    return nil unless response.success?

    Array(JSON.parse(response.body)["records"]).flat_map { |r| (r["fields"] || {}).keys }.uniq
  rescue StandardError
    nil
  end

  def usable_code_url_fields
    known = field_names
    # With no schema to check against, trust only the primary name rather than
    # risking a formula that fails wholesale.
    return CODE_URL_FIELDS.first(1) if known.empty?

    CODE_URL_FIELDS & known
  end

  def normalize(record)
    fields = record["fields"] || {}
    approved_at = fields[APPROVED_AT_FIELD]
    {
      "record_id" => record["id"],
      "record_url" => "https://airtable.com/#{base_id}/#{table_id}/#{record['id']}",
      "program" => pick(fields, PROGRAM_FIELDS) || "(unknown program)",
      # Derived: the table records approval as a timestamp, not a status column.
      "status" => approved_at.present? ? "Approved" : "Pending",
      "hours" => pick(fields, HOURS_FIELDS),
      "submitter" => [ fields[FIRST_NAME_FIELD], fields[LAST_NAME_FIELD] ].compact_blank.join(" ").presence,
      "email" => pick(fields, EMAIL_FIELDS),
      "code_url" => pick(fields, CODE_URL_FIELDS),
      "created_at" => pick(fields, CREATED_FIELDS),
      # Another program may already have justified this exact duplicate.
      "duplicate_justification" => fields[DUPLICATE_JUSTIFICATION_FIELD].presence
    }
  end

  def pick(fields, candidates)
    key = candidates.find { |c| fields[c].present? }
    value = key && fields[key]
    value.is_a?(Array) ? value.join(", ") : value
  end

  def test_connection!(token_override = nil)
    key = token_override.presence || pat
    raise "No Unified DB personal access token configured." if key.blank?

    response = Faraday.new(url: "https://api.airtable.com").get("/v0/#{base_id}/#{table_id}") do |req|
      req.headers["Authorization"] = "Bearer #{key}"
      req.params["maxRecords"] = 1
    end
    return if response.success?

    raise "Unified DB rejected the token (#{response.status}). Needs data.records:read on base #{base_id}."
  end

  def connection
    @connection = nil if Rails.env.test?
    @connection ||= Faraday.new(url: "https://api.airtable.com") do |f|
      f.options.timeout = 10
      f.options.open_timeout = 5
    end
  end
end
