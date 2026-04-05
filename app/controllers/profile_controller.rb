class ProfileController < ApplicationController
  def update_address
    current_user.update!(
      address_line1: params[:address_line1].to_s.strip.presence,
      address_line2: params[:address_line2].to_s.strip.presence,
      city: params[:city].to_s.strip.presence,
      state: params[:state].to_s.strip.presence,
      country: params[:country].to_s.strip.presence,
      postal_code: params[:postal_code].to_s.strip.presence
    )
    redirect_back fallback_location: root_path, notice: "Address saved."
  end
end
