class OnboardingController < ApplicationController
  def complete
    user = User.find(current_user.id)
    if user.onboarded_at.nil?
      user.update_columns(onboarded_at: Time.current)
      Rails.cache.delete("user/#{user.id}")
    end
    redirect_to home_path
  end

  def restart
    user = User.find(current_user.id)
    user.update_columns(onboarded_at: nil)
    Rails.cache.delete("user/#{user.id}")
    redirect_to home_path, notice: "Onboarding tour restarted."
  end
end
