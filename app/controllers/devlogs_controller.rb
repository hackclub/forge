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

  def upload_image
    authorize @project, :update?

    file = params[:file]
    unless file.respond_to?(:read)
      render json: { error: "No file uploaded." }, status: :unprocessable_entity
      return
    end

    cdn_url = HcCdnService.upload(io: file.tempfile, filename: file.original_filename, content_type: file.content_type)

    if cdn_url.present?
      url = cdn_url
    else
      blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename, content_type: file.content_type)
      app_url = ENV.fetch("APP_URL") { Rails.env.development? ? "http://localhost:3000" : "https://forge.hackclub.com" }
      url = Rails.application.routes.url_helpers.rails_blob_url(blob, host: app_url)
    end

    render json: { url: url, markdown: "![#{file.original_filename}](#{url})" }
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
