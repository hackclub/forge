class HomeController < ApplicationController
  def index
    projects = current_user.projects.kept.order(updated_at: :desc).to_a

    render inertia: "Home/Index", props: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email,
        avatar: current_user.avatar,
        created_at: current_user.created_at.strftime("%B %d, %Y")
      },
      stats: {
        projects_count: projects.size
      },
      projects: projects.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          updated_at: p.updated_at.strftime("%b %d, %Y")
        }
      }
    }
  end
end
