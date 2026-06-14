# frozen_string_literal: true

module Authentication
  extend ActiveSupport::Concern

  included do
      before_action :set_current_user
      before_action :authenticate_user!
      before_action :redirect_banned_user!
      before_action :block_money_actions_while_impersonating!
      helper_method :current_user, :user_signed_in?, :true_user, :impersonating?
  end

  class_methods do
    def allow_unauthenticated_access(only: nil)
      skip_before_action :authenticate_user!, only: only
    end
  end

  private

  def authenticate_user!
    unless current_user
      redirect_to root_path, alert: "You need to be logged in to see this!"
    end
  end

  def user_signed_in?
    current_user.present?
  end

  def set_current_user
    return unless session[:user_id]

    @current_user = Rails.cache.fetch("user/#{session[:user_id]}", expires_in: 5.minutes) do
      User.find_by(id: session[:user_id])
    end
  rescue ActiveRecord::Encryption::Errors::Decryption
    Rails.logger.warn("[Authentication] Decryption failed for user #{session[:user_id]}, clearing session")
    reset_session
    @current_user = nil
  end

  def current_user
    @current_user
  end

  def true_user
    return current_user unless impersonating?

    @true_user ||= User.find_by(id: session[:impersonator_id])
  end

  def impersonating?
    session[:impersonator_id].present?
  end

  def block_money_actions_while_impersonating!
    return unless impersonating?
    return unless controller_name == "shop" && action_name == "create"

    if request.format.json? || request.xhr?
      head :forbidden
    else
      redirect_back fallback_location: shop_path,
                    status: :see_other,
                    alert: "You can't spend a user's coins while viewing as them — stop impersonating first."
    end
  end

  def redirect_banned_user!
    redirect_to sorry_path if current_user&.is_banned?
  end

  def terminate_session
    reset_session
  end
end
