class ProfileController < ApplicationController
  def sync_address
    identity = HcaService.identity(current_user.hca_token)
    if identity.blank?
      redirect_back fallback_location: root_path, alert: "Couldn't reach HCA. Try again in a moment."
      return
    end

    current_user.apply_hca_identity(identity)
    audit!("user.address_synced", target: current_user, metadata: { from: "hca" })
    redirect_back fallback_location: root_path, notice: "Address refreshed from HCA."
  end
end
