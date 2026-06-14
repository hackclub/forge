# Lets a user-admin browse the app as another (non-staff) user for QA/support.
# The real admin's id is parked in session[:impersonator_id]; the session is
# read-only while impersonating (see Authentication#block_writes_while_impersonating!),
# so no actions — money or otherwise — can be taken as the impersonated user.
class ImpersonationsController < ApplicationController
  before_action :require_impersonation_permission!, only: :create

  def create
    if impersonating?
      redirect_to root_path, alert: "You're already viewing as someone else."
      return
    end

    target = User.find(params[:user_id])

    if target == current_user
      redirect_back fallback_location: admin_user_path(target), alert: "You can't impersonate yourself."
      return
    end

    if target.staff?
      redirect_back fallback_location: admin_user_path(target), alert: "You can't impersonate staff members."
      return
    end

    # Audit as the real admin (current_user is still the admin here).
    audit!("user.impersonation_started", target: target, metadata: { impersonated_user_id: target.id })

    session[:impersonator_id] = current_user.id
    session[:user_id] = target.id

    redirect_to root_path, notice: "Now viewing as #{target.display_name}."
  end

  def destroy
    unless impersonating?
      redirect_to root_path
      return
    end

    admin = User.find_by(id: session[:impersonator_id])
    target = current_user

    session[:user_id] = session.delete(:impersonator_id)

    if admin
      AuditEvent.create!(
        actor: admin,
        action: "user.impersonation_stopped",
        target: target,
        target_label: target&.display_name,
        metadata: { impersonated_user_id: target&.id },
        ip_address: request.remote_ip
      )
    end

    redirect_to admin_user_path(target), notice: "Stopped viewing as #{target&.display_name}."
  rescue StandardError
    redirect_to root_path, notice: "Stopped impersonating."
  end

  private

  def require_impersonation_permission!
    raise ActionController::RoutingError, "Not Found" unless current_user&.has_permission?("users")
  end
end
