class Projects::ViewsController < ApplicationController
  def create
    project = Project.find(params[:project_id])
    return head :no_content if project.user_id == current_user&.id
    return head :no_content unless current_user

    ProjectView.find_or_create_by(project: project, user: current_user)
    head :no_content
  rescue ActiveRecord::RecordNotUnique
    head :no_content
  end
end
