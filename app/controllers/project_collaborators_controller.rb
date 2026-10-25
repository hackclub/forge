class ProjectCollaboratorsController < ApplicationController
  def update
    @project = Project.kept.find(params[:project_id])
    collaborator = @project.project_collaborators.find(params[:id])

    unless collaborator.user_id == current_user&.id
      raise Pundit::NotAuthorizedError, query: :update?, record: collaborator
    end

    collaborator.update!(hackatime_projects: params.expect(collaborator: [ hackatime_projects: [] ])[:hackatime_projects])
    audit!("project_collaborator.hackatime_projects_updated", target: @project, metadata: {
      user_id: collaborator.user_id,
      hackatime_projects: collaborator.hackatime_projects
    })

    redirect_to @project, notice: "Hackatime projects updated."
  end

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
