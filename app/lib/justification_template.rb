class JustificationTemplate
  NOT_PROVIDED = "(not provided)".freeze

  TEMPLATE = <<~TEMPLATE.freeze
    This is the %{iteration} %{ship_type} ship of %{ship_name} for Forge. Submitted %{submittion_time}

    Time was logged journaling and committing through GitHub, This design may also include time lapsing if given by the user

    This project was approved at %{project_approval_time}

    1. Journaling time was verified/deflated by %{reviewer_name}%{reviewer_email} to ensure it matches our policy of what is allowed. Inactive and unrelated time was stripped according to our policy publicly available at here: https://forge.hackclub.com/docs/design/how-to-journal The project was then checked to ensure it meets our requirements of a "shipped" hardware project, which is publicly available here: https://forge.hackclub.com/docs/design/journal-format & https://forge.hackclub.com/docs/requirements/submitting

    3. A final check was done by Aarav (aarav@hackclub.com) and Souptik (Lead reviewer for forge), who is knowledgeable in hardware, to ensure nothing was missed prior, and that the projects meets our standards in terms of quality.

    Time evidence:
    %{time_evidence}

    Scope assessment:
    %{scope_reasoning}

    Supporting evidence:
    %{supporting_evidence}

    Hours claimed: %{claimed_hours}. Hours approved: %{approved_hours}.
    %{hours_deflation} hours of deflation was applied to meet our requirements%{deflation_reason}

    The final reviewer was asked to justify why this ship meets the standards of the Unified DB:

    %{review_justification}

    !! To inspect the full review for this ship, including timelapses & journals, see: %{forge_admin_link}

    For any questions, please reach out to aarav@hackclub.com.
  TEMPLATE

  def self.render_for_project(project:, reviewer:, claimed_hours:, approved_hours:, fields: {})
    render_text(
      iteration: "first",
      project: project,
      ship_type: ship_type_for(project),
      ship_name: project.name,
      submittion_time: project.created_at.strftime("%B %-d, %Y at %H:%M UTC"),
      project_approval_time: project.reviewed_at&.strftime("%B %-d, %Y at %H:%M UTC") || Time.current.strftime("%B %-d, %Y at %H:%M UTC"),
      reviewer_name: reviewer.display_name,
      reviewer_email: reviewer.email,
      claimed_hours: claimed_hours,
      approved_hours: approved_hours,
      forge_admin_link: admin_project_url(project),
      fields: fields.transform_keys(&:to_sym)
    )
  end

  def self.render_text(iteration:, project:, ship_type:, ship_name:, submittion_time:, project_approval_time:, reviewer_name:, reviewer_email:, claimed_hours:, approved_hours:, forge_admin_link:, fields:)
    deflation = (claimed_hours.to_f - approved_hours.to_f).round(1)
    deflation = 0 if deflation.negative?
    deflation_reason = fields[:deflation_reason].to_s.strip
    deflation_suffix = deflation > 0 && deflation_reason.present? ? " — reason: #{deflation_reason}" : ""

    format(
      TEMPLATE,
      iteration: iteration,
      ship_type: ship_type,
      ship_name: ship_name,
      submittion_time: submittion_time,
      project_approval_time: project_approval_time,
      reviewer_name: reviewer_name,
      reviewer_email: reviewer_email.present? ? " (#{reviewer_email})" : "",
      time_evidence: time_evidence(ship_type, fields),
      scope_reasoning: present(fields[:scope_reasoning]),
      supporting_evidence: supporting_evidence(project, fields),
      claimed_hours: format_hours(claimed_hours),
      approved_hours: format_hours(approved_hours),
      hours_deflation: deflation.to_s,
      deflation_reason: deflation_suffix,
      review_justification: fields[:assessment].to_s.strip.presence || "(no justification provided)",
      forge_admin_link: forge_admin_link
    )
  end

  def self.time_evidence(ship_type, fields)
    if ship_type == "build"
      present(fields[:time_summary])
    else
      [ "Hackatime project: #{present(fields[:hackatime_project])}",
        "Range analyzed: #{present(fields[:time_range])}",
        present(fields[:time_summary]) ].join("\n")
    end
  end

  def self.supporting_evidence(project, fields)
    count = project.devlogs.count
    lines = [
      "- Code repository: #{project.repo_link.presence || '(no repository linked)'}",
      "- Public project page: #{public_project_url(project)}",
      "- Devlogs: #{count} #{count == 1 ? 'entry' : 'entries'}"
    ]
    fields[:evidence].to_s.split("\n").map(&:strip).reject(&:blank?).each { |line| lines << "- #{line}" }
    lines.join("\n")
  end

  def self.present(value)
    value.to_s.strip.presence || NOT_PROVIDED
  end

  def self.format_hours(value)
    rounded = value.to_f.round(1)
    whole = rounded == rounded.to_i ? rounded.to_i : rounded
    "#{whole}h"
  end

  def self.ship_type_for(project)
    project.build_review? ? "build" : "design"
  end

  def self.public_project_url(project)
    "#{host_root}/projects/#{project.id}"
  end

  def self.admin_project_url(project)
    "#{host_root}/admin/projects/#{project.id}"
  end

  def self.host_root
    ENV.fetch("APP_URL", "https://forge.hackclub.com").sub(%r{/+$}, "")
  end
end
