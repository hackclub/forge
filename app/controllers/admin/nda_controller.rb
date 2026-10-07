class Admin::NdaController < Admin::ApplicationController
  before_action :require_nda_permission!

  def show
    users = elevated_users.to_a
    rows = users.map { |user| serialize_user(user, NdaService.status(user.slack_id)) }

    render inertia: "Admin/Nda/Index", props: {
      users: rows,
      total: rows.size,
      signed_count: rows.count { |r| r[:status] == "signed" },
      not_signed_count: rows.count { |r| r[:status] == "not_signed" },
      nda_version: rows.filter_map { |r| r[:nda_version] }.first
    }
  end

  def refresh
    NdaService.clear_cache(elevated_users.pluck(:slack_id))
    audit!("nda.refresh_triggered", target: nil)
    redirect_to admin_nda_path, notice: "NDA statuses refreshed."
  end

  private

  def require_nda_permission!
    require_permission!("nda")
  end

  def elevated_users
    User.kept.where("roles && ARRAY[?]::varchar[]", %w[admin reviewer support fulfillment]).order(:display_name)
  end

  def serialize_user(user, nda)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar: user.avatar,
      slack_id: user.slack_id,
      roles: user.roles - %w[user],
      status: user.slack_id.blank? ? "no_slack_id" : nda[:status],
      nda_version: nda[:nda_version],
      signed_at: nda[:signed_at]
    }
  end
end
