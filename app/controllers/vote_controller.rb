class VoteController < ApplicationController
  def index
    candidates = Project.kept.where(hidden: false).where.not(user_id: current_user.id).includes(:user).order("RANDOM()").limit(2)

    if candidates.size < 2
      render inertia: "Vote/Index", props: { matchup: nil }
      return
    end

    render inertia: "Vote/Index", props: {
      matchup: {
        project_a: serialize_vote_project(candidates[0]),
        project_b: serialize_vote_project(candidates[1])
      }
    }
  end

  def create
    # TODO: implement actual ranking algorithm (ELO/Glicko)
    redirect_to vote_path, notice: "Vote recorded!"
  end

  private

  def serialize_vote_project(project)
    {
      id: project.id,
      name: project.name,
      description: project.subtitle&.truncate(300),
      user_display_name: project.user.display_name,
      user_avatar: project.user.avatar,
      repo_link: project.repo_link
    }
  end
end
