class DevlogsController < ApplicationController
  before_action :set_project

  def create
    authorize @project, :update?

    @devlog = @project.devlogs.build(devlog_params)

    if @devlog.save
      redirect_to @project, notice: "Devlog entry added."
    else
      redirect_to @project, alert: @devlog.errors.full_messages.join(", ")
    end
  end

  def destroy
    @devlog = @project.devlogs.find(params[:id])
    authorize @project, :update?
    @devlog.destroy
    redirect_to @project, notice: "Devlog entry removed."
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def devlog_params
    params.expect(devlog: [ :title, :content, :time_spent ])
  end
end
