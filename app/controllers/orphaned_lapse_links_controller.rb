class OrphanedLapseLinksController < ApplicationController
  before_action :set_project

  def relink
    authorize @project, :manage_lapse_links?

    link = @project.orphaned_lapse_links.find(params[:id])
    devlog = @project.devlogs.find(params[:devlog_id])

    ActiveRecord::Base.transaction do
      devlog.update!(lapse_url: link.lapse_url)
      link.destroy!
    end

    redirect_to @project, notice: "Lapse link attached to \"#{devlog.title}\"."
  end

  def destroy
    authorize @project, :manage_lapse_links?

    @project.orphaned_lapse_links.find(params[:id]).destroy!
    redirect_to @project, notice: "Lapse link deleted."
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end
end
