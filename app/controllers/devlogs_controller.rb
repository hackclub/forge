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

  def update
    authorize @project, :update?
    @devlog = @project.devlogs.find(params[:id])

    if @devlog.update(devlog_params)
      redirect_to @project, notice: "Devlog entry updated."
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
    attrs = params.expect(devlog: [ :title, :content, :time_spent ])
    attrs[:time_spent] = normalize_time_spent(attrs[:time_spent])
    attrs
  end

  def normalize_time_spent(value)
    return value if value.blank?

    trimmed = value.to_s.strip
    return trimmed if trimmed.match?(/[a-z]/i)

    numeric = trimmed.match(/\A\d+(?:\.\d+)?\z/)
    return trimmed unless numeric

    hours = trimmed.to_f
    "#{trimmed} #{hours == 1 ? 'hour' : 'hours'}"
  end
end
