class ProfileController < ApplicationController
  def sync_address
    identity = HcaService.identity(current_user.hca_token)
    if identity.blank?
      redirect_back fallback_location: root_path, alert: "Couldn't reach HCA. Sign out and back in to reconnect your Hack Club account, then try again."
      return
    end

    unless current_user.apply_hca_identity(identity)
      redirect_back fallback_location: root_path, alert: "HCA sent details we couldn't save. Ping us in #forge-help."
      return
    end

    current_user.refresh_profile_from_slack
    audit!("user.address_synced", target: current_user, metadata: { from: "hca" })
    redirect_back fallback_location: root_path, notice: "Profile refreshed from HCA and Slack."
  end
end
