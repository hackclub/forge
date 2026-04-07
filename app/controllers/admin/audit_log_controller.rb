class Admin::AuditLogController < Admin::ApplicationController
  before_action :require_audit_log_permission!

  def index
    scope = PaperTrail::Version.order(created_at: :desc)
    scope = scope.where(item_type: params[:item_type]) if params[:item_type].present?
    scope = scope.where(event: params[:event]) if params[:event].present?
    @pagy, @versions = pagy(scope, limit: 50)

    render inertia: "Admin/AuditLog/Index", props: {
      entries: @versions.map { |v| serialize_version(v) },
      pagy: pagy_props(@pagy),
      filters: {
        item_type: params[:item_type].to_s,
        event: params[:event].to_s
      },
      item_types: PaperTrail::Version.distinct.pluck(:item_type).sort,
      events: PaperTrail::Version.distinct.pluck(:event).sort
    }
  end

  def show
    version = PaperTrail::Version.find(params[:id])
    actor = version.whodunnit.present? ? User.find_by(id: version.whodunnit) : nil

    previous_data = parse_object(version.object)
    current_item = begin
      version.item
    rescue StandardError
      nil
    end
    current_data = current_item&.attributes&.reject { |k, _| %w[hca_token].include?(k) } || {}

    changes = compute_changes(previous_data, current_data, version.event)

    render inertia: "Admin/AuditLog/Show", props: {
      entry: {
        id: version.id,
        item_type: version.item_type,
        item_id: version.item_id,
        event: version.event,
        description: describe_version(version),
        actor_id: version.whodunnit,
        actor_name: actor&.display_name || version.whodunnit || "System",
        created_at: version.created_at.strftime("%b %d, %Y %H:%M:%S"),
        changes: changes
      }
    }
  end

  private

  def require_audit_log_permission!
    require_permission!("audit_log")
  end

  def serialize_version(version)
    actor = version.whodunnit.present? ? User.find_by(id: version.whodunnit) : nil

    {
      id: version.id,
      item_type: version.item_type,
      item_id: version.item_id,
      event: version.event,
      description: describe_version(version),
      actor_name: actor&.display_name || version.whodunnit || "System",
      created_at: version.created_at.strftime("%b %d, %Y %H:%M:%S")
    }
  end

  def describe_version(version)
    previous = parse_object(version.object)
    item_name = resolve_item_name(version)

    case version.event
    when "create"
      "#{version.item_type} created: #{item_name}"
    when "destroy"
      "#{version.item_type} destroyed: #{item_name}"
    when "update"
      describe_update(version, previous, item_name)
    else
      "#{version.event} on #{version.item_type} #{item_name}"
    end
  end

  def describe_update(version, previous, item_name)
    current_item = begin
      version.item
    rescue StandardError
      nil
    end
    return "#{version.item_type} updated: #{item_name}" unless current_item

    current = current_item.attributes
    descriptions = []

    case version.item_type
    when "User"
      if changed?(previous, current, "is_banned")
        descriptions << (current["is_banned"] ? "Banned user" : "Unbanned user")
      end
      if changed?(previous, current, "roles")
        old_roles = Array(previous["roles"])
        new_roles = Array(current["roles"])
        added = new_roles - old_roles
        removed = old_roles - new_roles
        descriptions << "Granted role: #{added.join(', ')}" if added.any?
        descriptions << "Revoked role: #{removed.join(', ')}" if removed.any?
      end
      if changed?(previous, current, "permissions")
        old_perms = Array(previous["permissions"])
        new_perms = Array(current["permissions"])
        added = new_perms - old_perms
        removed = old_perms - new_perms
        descriptions << "Granted permission: #{added.join(', ')}" if added.any?
        descriptions << "Revoked permission: #{removed.join(', ')}" if removed.any?
      end
      if changed?(previous, current, "discarded_at")
        descriptions << (current["discarded_at"].present? ? "Soft-deleted user" : "Restored user")
      end
      if changed?(previous, current, "display_name")
        descriptions << "Renamed from '#{previous['display_name']}' to '#{current['display_name']}'"
      end
      if changed?(previous, current, "email")
        descriptions << "Email changed"
      end
      if changed?(previous, current, "ban_reason")
        descriptions << "Ban reason updated" if current["is_banned"]
      end
    when "Project"
      if changed?(previous, current, "status")
        old_status = previous["status"]
        new_status = current["status"]
        status_names = { 0 => "draft", 1 => "pending", 2 => "approved", 3 => "returned", 4 => "rejected" }
        old_name = old_status.is_a?(Integer) ? status_names[old_status] : old_status
        new_name = new_status.is_a?(Integer) ? status_names[new_status] : new_status
        descriptions << "Status changed: #{old_name} → #{new_name}"
      end
      if changed?(previous, current, "discarded_at")
        descriptions << (current["discarded_at"].present? ? "Soft-deleted project" : "Restored project")
      end
      if changed?(previous, current, "name")
        descriptions << "Renamed to '#{current['name']}'"
      end
      if changed?(previous, current, "review_feedback")
        descriptions << "Review feedback updated"
      end
      if changed?(previous, current, "reviewer_id")
        descriptions << "Reviewer assigned"
      end
    when "Ship"
      if changed?(previous, current, "status")
        descriptions << "Ship status changed to #{current['status']}"
      end
      if changed?(previous, current, "approved_seconds")
        descriptions << "Approved seconds set to #{current['approved_seconds']}"
      end
      if changed?(previous, current, "feedback")
        descriptions << "Ship feedback updated"
      end
    when "FeatureFlag"
      if changed?(previous, current, "enabled")
        descriptions << (current["enabled"] ? "Flag enabled" : "Flag disabled")
      end
      if changed?(previous, current, "name")
        descriptions << "Flag renamed to '#{current['name']}'"
      end
    end

    if descriptions.any?
      "#{item_name}: #{descriptions.join('; ')}"
    else
      changed_fields = (previous.keys + current.keys).uniq.select { |k| changed?(previous, current, k) } - %w[id created_at updated_at hca_token]
      "#{item_name}: updated #{changed_fields.join(', ')}"
    end
  end

  def changed?(previous, current, field)
    previous[field].to_s != current[field].to_s
  end

  def resolve_item_name(version)
    item = begin
      version.item
    rescue StandardError
      nil
    end

    case version.item_type
    when "User"
      item&.display_name || parse_object(version.object)["display_name"] || "##{version.item_id}"
    when "Project"
      item&.name || parse_object(version.object)["name"] || "##{version.item_id}"
    when "FeatureFlag"
      item&.name || parse_object(version.object)["name"] || "##{version.item_id}"
    when "Ship"
      "##{version.item_id}"
    else
      "##{version.item_id}"
    end
  end

  def parse_object(object_text)
    return {} unless object_text.present?
    YAML.safe_load(
      object_text,
      permitted_classes: [ Time, Date, ActiveSupport::TimeWithZone, ActiveSupport::TimeZone, Symbol, BigDecimal ]
    ) || {}
  rescue StandardError
    {}
  end

  def sanitize_data(data)
    return {} unless data.is_a?(Hash)
    data.reject { |k, _| %w[hca_token].include?(k) }.transform_values { |v| v.is_a?(Time) || v.is_a?(ActiveSupport::TimeWithZone) ? v.iso8601 : v }
  end

  def compute_changes(previous, current, event)
    return [] if event == "create" && previous.empty?

    all_keys = (previous.keys + current.keys).uniq - %w[id created_at updated_at hca_token]
    all_keys.filter_map do |key|
      old_val = previous[key]
      new_val = current[key]
      next if old_val.to_s == new_val.to_s

      { field: key, from: format_value(old_val), to: format_value(new_val) }
    end
  end

  def format_value(val)
    case val
    when nil then nil
    when Time, ActiveSupport::TimeWithZone then val.iso8601
    when Array then val.join(", ")
    else val.to_s
    end
  end
end
