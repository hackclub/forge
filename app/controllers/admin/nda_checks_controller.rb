class Admin::NdaChecksController < Admin::ApplicationController
  skip_before_action :require_nda!

  def create
    NdaService.clear_cache([ current_user.slack_id ])
    redirect_back_or_to admin_root_path
  end
end
