class GuidesFilesController < ApplicationController
  allow_unauthenticated_access only: %i[show]

  def show
    slug = params[:slug].to_s
    not_found unless slug.match?(GuidesProps::GUIDE_SLUG_PATTERN)

    guide_dir = Rails.root.join("guides").glob("*").find { |dir| dir.directory? && dir.basename.to_s == slug }
    not_found unless guide_dir

    base = guide_dir.join("files")
    requested = params[:path].to_s
    path = Dir.glob(base.join("**/*").to_s).find do |candidate|
      File.file?(candidate) && Pathname.new(candidate).relative_path_from(base).to_s == requested
    end
    not_found unless path

    mime = Marcel::MimeType.for(name: File.basename(path))
    send_file path, type: mime, disposition: mime.start_with?("image/") ? "inline" : "attachment"
  end

  private

  def not_found
    raise ActionController::RoutingError, "Not Found"
  end
end
