class SubmissionRequirements
  VCS_HOST_PATTERN = /\A(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org|codeberg\.org)\//i

  def self.for_project(project)
    user = project.user
    [
      field("code_url", "Code URL", code_url_ok?(project), code_url_detail(project)),
      field("readme", "README", project.readme_cache.present?,
            project.readme_cache.present? ? "README cached — confirm setup/run instructions" : "Not cached — verify the repo has a README"),
      field("commits", "Multiple commits", nil, "Verify the repo has a real commit history (a single commit is not acceptable for significant hours)"),
      field("playable_url", "Playable URL", code_url_ok?(project),
            "Synced as the GitHub repo URL — confirm it is public and the project can be run from it"),
      field("screenshot", "Screenshot", project.cover_image_url.present?, nil),
      field("description", "Description", description_ok?(project), nil),
      field("email", "Email", user.email.present?, nil),
      field("first_name", "First name", user.first_name.present?, nil),
      field("last_name", "Last name", user.last_name.present?, nil),
      field("address", "Address", user.address_line1.present?, nil),
      field("city", "City", user.city.present?, nil),
      field("state", "State / Province", user.state.present?, nil),
      field("country", "Country", user.country.present?, nil),
      field("postal_code", "ZIP / Postal code", user.postal_code.present?, nil),
      field("birthday", "Birthday", user.birthday.present?, nil)
    ]
  end

  def self.field(key, label, ok, detail)
    { key: key, label: label, ok: ok, detail: detail }
  end

  def self.code_url_ok?(project)
    project.repo_link.present? && project.repo_link.match?(VCS_HOST_PATTERN)
  end

  def self.code_url_detail(project)
    return "No repository linked" if project.repo_link.blank?
    return "Link is not a recognised version-control host" unless project.repo_link.match?(VCS_HOST_PATTERN)

    nil
  end

  def self.description_ok?(project)
    project.pitch_text.present? || project.description.present? || project.subtitle.present?
  end
end
