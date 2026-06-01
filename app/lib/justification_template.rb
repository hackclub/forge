class JustificationTemplate
  ORDINALS = {
    1 => "first", 2 => "second", 3 => "third", 4 => "fourth", 5 => "fifth",
    6 => "sixth", 7 => "seventh", 8 => "eighth", 9 => "ninth", 10 => "tenth"
  }.freeze

  TEMPLATE = <<~TEMPLATE.freeze
    This is the %{iteration} %{ship_type} ship of %{ship_name} for Forge. Submitted %{submittion_time}

    Time was logged journaling and committing through GitHub, This design may also include time lapsing if given by the user

    This project was approved at %{project_approval_time}

    1. Journaling time was verified/deflated by %{reviewer_name}%{reviewer_email} to ensure it matches our policy of what is allowed. Inactive and unrelated time was stripped according to our policy publicly available at here: https://forge.hackclub.com/docs/design/how-to-journal The project was then checked to ensure it meets our requirements of a "shipped" hardware project, which is publicly available here: https://forge.hackclub.com/docs/design/journal-format & https://forge.hackclub.com/docs/requirements/submitting

    3. A final check was done by Aarav (aarav@hackclub.com) and Souptik (Lead reviewer for forge), who is knowledgeable in hardware, to ensure nothing was missed prior, and that the projects meets our standards in terms of quality.

    %{hours_deflation} hours of deflation was applied to meet our requirements

    The final reviewer was asked to justify why this ship meets the standards of the Unified DB:

    %{review_justification}

    !! To inspect the full review for this ship, including timelapses & journals, see: %{forge_admin_link}

    For any questions, please reach out to aarav@hackclub.com.
  TEMPLATE

  def self.render(ship:, reviewer:, claimed_hours:, approved_hours:, review_justification:)
    project = ship.project
    iteration_number = project.ships.order(:created_at).pluck(:id).index(ship.id).to_i + 1
    iteration = ORDINALS[iteration_number] || "#{iteration_number}th"

    render_text(
      iteration: iteration,
      ship_type: ship_type_for(project),
      ship_name: project.name,
      submittion_time: ship.created_at.strftime("%B %-d, %Y at %H:%M UTC"),
      project_approval_time: project.reviewed_at&.strftime("%B %-d, %Y at %H:%M UTC") || "pending",
      reviewer_name: reviewer.display_name,
      reviewer_email: reviewer.email,
      claimed_hours: claimed_hours,
      approved_hours: approved_hours,
      review_justification: review_justification,
      forge_admin_link: admin_ship_url(ship)
    )
  end

  def self.render_for_project(project:, reviewer:, claimed_hours:, approved_hours:, review_justification:)
    render_text(
      iteration: "first",
      ship_type: ship_type_for(project),
      ship_name: project.name,
      submittion_time: project.created_at.strftime("%B %-d, %Y at %H:%M UTC"),
      project_approval_time: project.reviewed_at&.strftime("%B %-d, %Y at %H:%M UTC") || Time.current.strftime("%B %-d, %Y at %H:%M UTC"),
      reviewer_name: reviewer.display_name,
      reviewer_email: reviewer.email,
      claimed_hours: claimed_hours,
      approved_hours: approved_hours,
      review_justification: review_justification,
      forge_admin_link: admin_project_url(project)
    )
  end

  def self.render_text(iteration:, ship_type:, ship_name:, submittion_time:, project_approval_time:, reviewer_name:, reviewer_email:, claimed_hours:, approved_hours:, review_justification:, forge_admin_link:)
    deflation = (claimed_hours.to_f - approved_hours.to_f).round(1)
    deflation = 0 if deflation.negative?

    format(
      TEMPLATE,
      iteration: iteration,
      ship_type: ship_type,
      ship_name: ship_name,
      submittion_time: submittion_time,
      project_approval_time: project_approval_time,
      reviewer_name: reviewer_name,
      reviewer_email: reviewer_email.present? ? " (#{reviewer_email})" : "",
      hours_deflation: deflation.to_s,
      review_justification: review_justification.to_s.strip.presence || "(no justification provided)",
      forge_admin_link: forge_admin_link
    )
  end

  def self.ship_type_for(project)
    project.build_review? ? "build" : "design"
  end

  def self.admin_ship_url(ship)
    host = host_root
    "#{host}/admin/ships/#{ship.id}"
  end

  def self.admin_project_url(project)
    host = host_root
    "#{host}/admin/projects/#{project.id}"
  end

  def self.host_root
    ENV.fetch("APP_URL", "https://forge.hackclub.com").sub(%r{/+$}, "")
  end
end
