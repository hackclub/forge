class Admin::JobsBaseController < ApplicationController
  include NdaGate

  before_action :require_nda!

  private

  def require_nda!
    redirect_to admin_root_path unless nda_cleared?
  end
end
