class Admin::StaticPagesController < Admin::ApplicationController
  def index
    render inertia: "Admin/StaticPages/Index"
  end
end
