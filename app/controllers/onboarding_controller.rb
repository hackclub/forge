class OnboardingController < ApplicationController
  def complete
    if current_user.onboarded_at.nil?
      current_user.update_columns(onboarded_at: Time.current)
      Rails.cache.delete("user/#{current_user.id}")
    end
    redirect_to home_path
  end

  def restart
    current_user.update_columns(onboarded_at: nil)
    Rails.cache.delete("user/#{current_user.id}")
    redirect_to home_path, notice: "Onboarding tour restarted."
  end
end
