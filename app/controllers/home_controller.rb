class HomeController < ApplicationController
  def index
    projects = current_user.projects.kept.order(updated_at: :desc)
    loaded_projects = projects.to_a

    ship_counts = current_user.ships.group(:status).count
    total_ships = ship_counts.values.sum

    project_ids = loaded_projects.map(&:id)
    ships_by_project = Ship.where(project_id: project_ids).group(:project_id, :status).count

    recent_ships = current_user.ships.order(created_at: :desc).limit(5).includes(project: :user)

    render inertia: "Home/Index", props: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email,
        avatar: current_user.avatar,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      stats: {
        projects_count: loaded_projects.size,
        total_ships: total_ships,
        pending_ships: ship_counts["pending"] || 0,
        approved_ships: ship_counts["approved"] || 0,
        returned_ships: ship_counts["returned"] || 0,
        rejected_ships: ship_counts["rejected"] || 0
      },
      projects: loaded_projects.map { |p|
        project_ships = ships_by_project.select { |k, _| k[0] == p.id }
        ships_total = project_ships.values.sum
        pending = project_ships.select { |k, _| k[1] == "pending" }.values.sum
        approved = project_ships.select { |k, _| k[1] == "approved" }.values.sum
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          ships_count: ships_total,
          pending_ships: pending,
          approved_ships: approved,
          updated_at: p.updated_at.strftime("%b %d, %Y")
        }
      },
      recent_ships: recent_ships.map { |s|
        {
          id: s.id,
          project_name: s.project.name,
          status: s.status,
          feedback: s.feedback,
          created_at: s.created_at.strftime("%b %d, %Y")
        }
      }
    }
  end
end
