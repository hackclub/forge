class ShopController < ApplicationController
  def index
    render inertia: "Shop/Index"
  end
end
