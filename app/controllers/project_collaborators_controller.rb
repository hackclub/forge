class ProjectCollaboratorsController < ApplicationController
  def destroy
    @project = Project.kept.find(params[:project_id])
    collaborator = @project.project_collaborators.find(params[:id])

    leaving_self = collaborator.user_id == current_user&.id
    unless leaving_self || policy(@project).manage_team?
      raise Pundit::NotAuthorizedError, query: :manage_team?, record: @project
    end

    collaborator.destroy
    audit!("project_collaborator.removed", target: @project, metadata: {
      user_id: collaborator.user_id,
      via: leaving_self ? "self" : "owner"
    })

    if leaving_self
      redirect_to root_path, notice: "You've left #{@project.name}. Your devlogs stay with the project."
    else
      redirect_to @project, notice: "Removed #{collaborator.user.display_name} from the team. Their devlogs stay with the project."
    end
  end
end
