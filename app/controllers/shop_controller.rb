class ShopController < ApplicationController
  allow_unauthenticated_access only: [ :index ]

  def index
    render inertia: "Shop/Index"
  end
end
