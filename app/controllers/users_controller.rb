class UsersController < ApplicationController
  def show
    user = User.kept.find(params[:id])
    projects = user.projects.kept.where(hidden: false).includes(:devlogs, :ships).order(created_at: :desc)
    kudos = user.kudos.includes(:author, :project).order(created_at: :desc)

    total_hours = projects.sum(&:total_hours)
    approved_count = projects.count { |p| p.approved? || p.build_pending? || p.build_approved? }
    built_count = projects.count(&:build_approved?)

    render inertia: "Users/Show", props: {
      user: {
        id: user.id,
        display_name: user.display_name,
        avatar: user.avatar,
        joined_at: user.created_at.strftime("%B %Y"),
        github_username: user.github_username
      },
      can_edit_profile: current_user.present? && current_user.id == user.id,
      stats: {
        total_hours: total_hours.round(1),
        projects_count: projects.size,
        approved_count: approved_count,
        built_count: built_count,
        kudos_count: kudos.size
      },
      projects: projects.map { |p|
        {
          id: p.id,
          name: p.name,
          subtitle: p.subtitle,
          status: p.status,
          cover_image_url: p.cover_image_url,
          total_hours: p.total_hours.round(1),
          created_at: p.created_at.strftime("%b %d, %Y")
        }
      },
      kudos: kudos.map { |k|
        {
          id: k.id,
          content: k.content,
          author_id: k.author_id,
          author_name: k.author.display_name,
          author_avatar: k.author.avatar,
          author_is_staff: k.author.staff?,
          can_destroy: current_user.present? && (current_user.id == k.author_id || current_user.has_permission?("users")),
          created_at: k.created_at.strftime("%b %d, %Y"),
          project_id: k.project_id,
          project_name: k.project&.name
        }
      },
      can_give_kudos: current_user.present? && current_user.id != user.id
    }
  end

  def add_kudo
    target = User.kept.find(params[:id])
    if current_user.id == target.id
      redirect_to user_path(target), alert: "You can't give yourself kudos."
      return
    end

    content = params[:content].to_s.strip
    if content.blank?
      redirect_to user_path(target), alert: "Kudos can't be empty."
      return
    end

    kudo = target.kudos.create!(content: content, author: current_user)
    audit!("user.kudo_added", target: target, metadata: { kudo_id: kudo.id, content: kudo.content, via: "profile" })
    redirect_to user_path(target), notice: "Kudos sent."
  end

  def destroy_kudo
    target = User.kept.find(params[:id])
    kudo = target.kudos.find(params[:kudo_id])

    unless current_user.id == kudo.author_id || current_user.has_permission?("users")
      raise ActionController::RoutingError, "Not Found"
    end

    audit!("user.kudo_destroyed", target: target, metadata: { kudo_id: kudo.id, content: kudo.content, via: "profile" })
    kudo.destroy
    redirect_to user_path(target), notice: "Kudos deleted."
  end

  def update_github
    unless current_user&.id == params[:id].to_i
      redirect_to user_path(params[:id]), alert: "You can only edit your own profile."
      return
    end

    username = params[:github_username].to_s.strip
    if username.present? && !username.match?(/\A[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\z/)
      redirect_to user_path(current_user), alert: "Invalid GitHub username."
      return
    end

    current_user.update!(github_username: username.presence)
    redirect_to user_path(current_user), notice: "GitHub profile updated."
  end
end
