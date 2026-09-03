# Finds every prior submission of the same repo, across Forge, the YSWS Unified
# Database and Macondo, so a reviewer sees a double-dip before approving rather
# than reading about it in a fine.
#
# Reviewers asked for this directly ("We should have a thingy that checks if a
# project is double dipped or not like macondo" / "can you have unified tables
# check if double dipped"), and it is the largest fine category by a wide
# margin.
module DuplicateScan
  module_function

  CACHE_TTL = 30.minutes

  # A design ship and its build ship legitimately share a repo, as do updates to
  # a project already shipped on Forge — those are related, not duplicates.
  def run(project, refresh: false)
    slug = UnifiedDbService.repo_slug(project.repo_link)
    return empty_result("No GitHub/GitLab repo linked — nothing to compare.") if slug.blank?

    key = [ "duplicate_scan", "v1", project.id, slug ]
    Rails.cache.delete(key) if refresh

    cached = Rails.cache.read(key)
    return cached if cached.present?

    result = scan(project, slug)
    # A failed cross-program lookup must not be remembered as "clear" — that
    # would hide a real double-dip for the whole TTL. Leave it uncached so the
    # next page load retries.
    Rails.cache.write(key, result, expires_in: CACHE_TTL) unless result["unified_error"]
    result
  end

  def scan(project, slug)
    forge   = forge_matches(project, slug)
    macondo = macondo_matches(project)

    begin
      unified = UnifiedDbService.records_for_repo(project.repo_link)
      unified_error = false
    rescue UnifiedDbService::LookupError => e
      Rails.logger.error("DuplicateScan unified lookup failed for project #{project.id}: #{e.message}")
      unified = []
      unified_error = true
    end

    {
      "slug" => slug,
      "forge" => forge,
      "unified" => unified,
      "macondo" => macondo,
      "unified_available" => UnifiedDbService.enabled?,
      "unified_error" => unified_error,
      "verdict" => verdict(forge, unified, macondo),
      "scanned_at" => Time.current.iso8601
    }
  end

  # Other Forge projects on the same repo, excluding this project's own
  # design/build counterpart.
  def forge_matches(project, slug)
    related_ids = [ project.id, project.linked_project_id, project.build_review_for_project&.id ].compact

    Project.where.not(id: related_ids)
           .where("repo_link ILIKE ?", "%#{slug}%")
           .includes(:user)
           .order(created_at: :asc)
           .limit(10)
           .filter_map do |other|
      next unless UnifiedDbService.repo_slug(other.repo_link) == slug

      {
        "id" => other.id,
        "name" => other.name,
        "status" => other.status,
        "build_review" => other.build_review,
        "owner" => other.user&.display_name,
        "same_owner" => other.user_id == project.user_id,
        "approved_at" => other.reviewed_at&.iso8601,
        "path" => "/admin/projects/#{other.id}"
      }
    end
  end

  def macondo_matches(project)
    return [] unless MacondoService.enabled?

    id = MacondoService.parse_project_id(project.repo_link) ||
         MacondoService.parse_project_id(project.build_proof_url)
    return [] if id.blank?

    json = MacondoService.get_project(id)
    return [] if json.blank? || !MacondoService.shipped?(json)

    [ { "id" => id, "title" => json["title"] || json["name"], "shipped" => true } ]
  end

  # `blocked` means approving is almost certainly a fine; `review` means it needs
  # a human call (an update or a design/build pair legitimately looks like this).
  def verdict(forge, unified, macondo)
    return "blocked" if unified.any? || macondo.any?
    return "blocked" if forge.any? { |m| m["status"] == "approved" && !m["same_owner"] }
    return "review" if forge.any?

    "clear"
  end

  def empty_result(reason)
    { "slug" => nil, "forge" => [], "unified" => [], "macondo" => [],
      "unified_available" => UnifiedDbService.enabled?, "unified_error" => false,
      "verdict" => "clear", "reason" => reason, "scanned_at" => Time.current.iso8601 }
  end
end
