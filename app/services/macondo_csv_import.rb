require "csv"
require "json"

module MacondoCsvImport
  TRUSTED_CDN_HOST = "cdn.hackclub.com"

  module_function

  def call(csv_content, dry_run: false)
    result = { imported: [], already_imported: 0, missing_owners: [], missing_collaborators: [], failures: [] }

    CSV.parse(csv_content, headers: true) do |row|
      import_row(row, result, dry_run: dry_run)
    end

    result
  rescue CSV::MalformedCSVError => e
    result[:failures] << { macondo_project_id: nil, message: "Couldn't parse the CSV: #{e.message}" }
    result
  end

  def import_row(row, result, dry_run: false)
    macondo_project_id = row["project_id"].to_s.strip
    return if macondo_project_id.blank?

    if Project.exists?(macondo_project_id: macondo_project_id)
      result[:already_imported] += 1
      return
    end

    owner = find_user(row["author_email"])
    if owner.nil?
      result[:missing_owners] << { macondo_project_id: macondo_project_id, email: row["author_email"] }
      return
    end

    journals = json_array(row["journals"])

    ActiveRecord::Base.transaction do
      project = create_project(row, owner, macondo_project_id)
      add_collaborators(project, row, owner, result)
      add_devlogs(project, journals, owner)

      raise ActiveRecord::Rollback if dry_run
    end

    result[:imported] << { macondo_project_id: macondo_project_id, name: row["project_title"], email: owner.email, devlogs: journals.size }
  rescue StandardError => e
    result[:failures] << { macondo_project_id: macondo_project_id, message: "#{e.class}: #{e.message}" }
  end

  def create_project(row, owner, macondo_project_id)
    Project.create!(
      user: owner,
      name: row["project_title"].to_s.strip,
      subtitle: row["project_description"].to_s.strip.presence,
      repo_link: row["repository_url"].presence,
      cover_image_url: cover_image_url(row["thumbnail_url"]),
      hackatime_projects: json_array(row["author_hackatime_projects"]) + json_array(row["collaborator_hackatime_projects"]),
      devlog_mode: "website",
      status: :draft,
      tier: Project::TIERS.last,
      macondo_project_id: macondo_project_id,
      macondo_tier: row["tier"].presence&.to_i,
      created_at: timestamp(row["created_at"]) || Time.current
    )
  end

  def add_collaborators(project, row, owner, result)
    json_array(row["collaborator_emails"]).each do |email|
      collaborator = find_user(email)
      if collaborator.nil?
        result[:missing_collaborators] << { macondo_project_id: project.macondo_project_id, email: email }
        next
      end
      next if collaborator.id == owner.id

      project.project_collaborators.create!(user: collaborator)
    end
  end

  def add_devlogs(project, journals, owner)
    journals.sort_by { |journal| timestamp(journal["created_at"]) || Time.zone.at(0) }.each do |journal|
      created_at = timestamp(journal["created_at"]) || project.created_at
      hours = journal["hours"]

      project.devlogs.create!(
        user: find_user(journal["author_email"]) || owner,
        title: journal["title"].to_s.strip.presence || "Imported entry",
        content: journal["content"].to_s.presence || "Imported from Macondo.",
        time_hours: hours,
        time_spent: hours.present? ? "#{hours.to_f.round(2)} hours" : nil,
        entry_date: created_at.to_date,
        created_at: created_at
      )
    end
  end

  def find_user(email)
    return nil if email.blank?

    User.kept.find_by("LOWER(email) = ?", email.to_s.strip.downcase)
  end

  def json_array(value)
    Array(JSON.parse(value.presence || "[]"))
  rescue JSON::ParserError
    []
  end

  def timestamp(value)
    Time.zone.parse(value.to_s)
  rescue ArgumentError, TypeError
    nil
  end

  def cover_image_url(url)
    uri = URI.parse(url.to_s)
    uri.is_a?(URI::HTTPS) && uri.host == TRUSTED_CDN_HOST ? url : nil
  rescue URI::InvalidURIError
    nil
  end
end
