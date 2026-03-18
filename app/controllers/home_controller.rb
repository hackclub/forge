class HomeController < ApplicationController
  def index
    projects = current_user.projects.kept.includes(:ships).order(updated_at: :desc)
    ships = current_user.ships

    render inertia: "Home/Index", props: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email,
        avatar: current_user.avatar,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      stats: {
        projects_count: projects.size,
        total_ships: ships.count,
        pending_ships: ships.pending.count,
        approved_ships: ships.approved.count,
        returned_ships: ships.returned.count,
        rejected_ships: ships.rejected.count
      },
      projects: projects.map { |p|
        {
          id: p.id,
          name: p.name,
          description: p.description,
          tags: p.tags,
          ships_count: p.ships.size,
          pending_ships: p.ships.count(&:pending?),
          approved_ships: p.ships.count(&:approved?),
          updated_at: p.updated_at.strftime("%b %d, %Y")
        }
      },
      recent_ships: ships.order(created_at: :desc).limit(5).includes(project: :user).map { |s|
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
