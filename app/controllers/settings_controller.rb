class SettingsController < ApplicationController
  def show
    user = current_user

    render inertia: "Settings/Show", props: {
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        avatar: user.avatar,
        github_username: user.github_username,
        git_provider: user.git_provider || "github"
      },
      address: user.address_line1.present? ? {
        address_line1: user.address_line1,
        address_line2: user.address_line2,
        city: user.city,
        state: user.state,
        country: user.country,
        postal_code: user.postal_code,
        phone_number: user.phone_number
      } : nil,
      hca_address_portal_url: HcaService.address_portal_url(return_to: settings_url)
    }
  end
end
