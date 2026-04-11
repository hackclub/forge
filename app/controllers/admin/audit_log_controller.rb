class Admin::AuditLogController < Admin::ApplicationController
  before_action :require_audit_log_permission!

  def index
    scope = AuditEvent.includes(:actor).order(created_at: :desc)
    scope = scope.where(action: params[:action_filter]) if params[:action_filter].present?
    scope = scope.where(target_type: params[:target_type]) if params[:target_type].present?
    scope = scope.where(actor_id: params[:actor_id]) if params[:actor_id].present?
    @pagy, @events = pagy(scope, limit: 50)

    render inertia: "Admin/AuditLog/Index", props: {
      entries: @events.map { |e| serialize_event(e) },
      pagy: pagy_props(@pagy),
      filters: {
        action: params[:action_filter].to_s,
        target_type: params[:target_type].to_s,
        actor_id: params[:actor_id].to_s
      },
      actions: AuditEvent.distinct.order(:action).pluck(:action),
      target_types: AuditEvent.where.not(target_type: nil).distinct.order(:target_type).pluck(:target_type)
    }
  end

  def show
    event = AuditEvent.includes(:actor).find(params[:id])

    render inertia: "Admin/AuditLog/Show", props: {
      entry: {
        id: event.id,
        action: event.action,
        description: describe(event),
        actor_id: event.actor_id,
        actor_name: event.actor&.display_name || "System",
        target_type: event.target_type,
        target_id: event.target_id,
        target_label: event.target_label,
        target_url: target_url_for(event),
        metadata: event.metadata || {},
        ip_address: event.ip_address,
        created_at: event.created_at.strftime("%b %d, %Y %H:%M:%S")
      }
    }
  end

  private

  def require_audit_log_permission!
    require_permission!("audit_log")
  end

  def serialize_event(event)
    {
      id: event.id,
      action: event.action,
      description: describe(event),
      actor_id: event.actor_id,
      actor_name: event.actor&.display_name || "System",
      target_type: event.target_type,
      target_id: event.target_id,
      target_label: event.target_label,
      target_url: target_url_for(event),
      created_at: event.created_at.strftime("%b %d, %Y %H:%M:%S")
    }
  end

  def describe(event)
    target = event.target_label.presence || (event.target_id ? "##{event.target_id}" : nil)
    base = ACTION_DESCRIPTIONS[event.action] || event.action.tr("_.", " ")
    target ? "#{base} #{target}" : base
  end

  def target_url_for(event)
    return nil unless event.target_type && event.target_id

    case event.target_type
    when "Project" then admin_project_path(event.target_id)
    when "User"    then admin_user_path(event.target_id)
    when "FeatureFlag" then admin_feature_flags_path
    when "NewsPost" then admin_news_posts_path
    when "SupportTicket" then admin_support_ticket_path(event.target_id)
    when "Order" then admin_order_path(event.target_id)
    when "ShopItem" then admin_shop_items_path
    end
  end

  ACTION_DESCRIPTIONS = {
    "auth.signed_in" => "Signed in",
    "auth.signed_out" => "Signed out",
    "project.created" => "Created project",
    "project.updated" => "Updated project",
    "project.submitted_for_review" => "Submitted project for review",
    "project.build_submitted" => "Submitted build for review on",
    "project.journal_synced" => "Synced JOURNAL.md for",
    "project.approved" => "Approved project",
    "project.returned" => "Returned project",
    "project.rejected" => "Rejected project",
    "project.reverted_to_draft" => "Reverted project to draft",
    "project.build_approved" => "Approved build for",
    "project.build_returned" => "Returned build for",
    "project.build_rejected" => "Rejected build for",
    "project.review_notes_saved" => "Saved review notes for",
    "project.readme_refreshed" => "Refreshed README for",
    "project.visibility_toggled" => "Toggled visibility on",
    "project.staff_pick_toggled" => "Toggled staff pick on",
    "project.restored" => "Restored project",
    "project.soft_deleted" => "Soft-deleted project",
    "project.destroyed" => "Permanently deleted project",
    "user.banned" => "Banned",
    "user.unbanned" => "Unbanned",
    "user.restored" => "Restored user",
    "user.soft_deleted" => "Soft-deleted",
    "user.destroyed" => "Permanently deleted user",
    "user.roles_updated" => "Updated roles for",
    "user.permissions_updated" => "Updated permissions for",
    "user.beta_approval_toggled" => "Toggled beta approval for",
    "user.shop_unlocked_toggled" => "Toggled shop access for",
    "user.note_added" => "Added internal note on",
    "user.note_destroyed" => "Deleted internal note from",
    "user.kudo_added" => "Gave kudos to",
    "user.kudo_destroyed" => "Removed kudos from",
    "user.coins_adjusted" => "Adjusted coins for",
    "feature_flag.created" => "Created feature flag",
    "feature_flag.toggled" => "Toggled feature flag",
    "feature_flag.destroyed" => "Deleted feature flag",
    "news_post.created" => "Created news post",
    "news_post.updated" => "Updated news post",
    "news_post.publish_toggled" => "Toggled publish on news post",
    "news_post.destroyed" => "Deleted news post",
    "support_ticket.replied" => "Replied to support ticket from",
    "support_ticket.claimed" => "Claimed support ticket from",
    "support_ticket.resolved" => "Resolved support ticket from",
    "support_ticket.destroyed" => "Deleted support ticket from",
    "rsvp.destroyed" => "Removed RSVP",
    "rsvp.exported" => "Exported RSVPs",
    "database.queried" => "Ran database query",
    "order.created" => "Placed order",
    "order.approved" => "Approved order",
    "order.rejected" => "Rejected order",
    "order.fulfilled" => "Fulfilled order",
    "shop_item.created" => "Created shop item",
    "shop_item.updated" => "Updated shop item",
    "shop_item.destroyed" => "Deleted shop item",
    "project.marked_built" => "Marked built",
    "project.kudo_added" => "Kudos added on",
    "project.kudo_destroyed" => "Kudos removed from"
  }.freeze
end
