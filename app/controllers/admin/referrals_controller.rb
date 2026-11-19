class Admin::ReferralsController < Admin::ApplicationController
  before_action :require_referrals_permission!

  def index
    render inertia: "Admin/Referrals/Index", props: {
      users: index_users,
      stats: dashboard_stats,
      pin_threshold: Referral::PIN_THRESHOLD
    }
  end

  def show
    @user = User.find(params[:id])
    referrals = @user.referrals_made.includes(:referred, :qualifying_project).order(created_at: :desc)
    pins = @user.referral_pins.includes(:order).order(milestone: :desc)

    render inertia: "Admin/Referrals/Show", props: {
      user: {
        id: @user.id,
        display_name: @user.display_name,
        avatar: @user.avatar,
        referral_code: @user.referral_code
      },
      referrals: referrals.map { |r| serialize_referral(r) },
      pins: pins.map { |p| serialize_pin(p) },
      pin_threshold: Referral::PIN_THRESHOLD
    }
  end

  def approve_one
    referral = Referral.find(params[:referral_id])
    unless referral.eligible?
      redirect_to admin_referral_path(referral.referrer_id), alert: "Referral is not eligible yet."
      return
    end

    referral.approve!(actor: current_user)
    audit!("referral.approved", target: referral.referrer, metadata: {
      referral_id: referral.id,
      referred_id: referral.referred_id
    })
    redirect_to admin_referral_path(referral.referrer_id), notice: "Referral approved."
  end

  def approve_all
    user = User.find(params[:id])
    eligible = user.referrals_made.eligible
    count = 0
    eligible.each do |r|
      r.approve!(actor: current_user)
      count += 1
    end
    audit!("referral.approved_bulk", target: user, metadata: { count: count })
    redirect_to admin_referral_path(user), notice: "Approved #{count} referral#{'s' unless count == 1}."
  end

  private

  def require_referrals_permission!
    require_permission!("referrals")
  end

  def dashboard_stats
    {
      total_unique_referrals: Referral.count,
      approved_count: Referral.approved.count,
      eligible_count: Referral.eligible.count,
      pending_count: Referral.pending.count,
      pins_earned: ReferralPin.count,
      pins_shipped: ReferralPin.joins(:order).merge(Order.fulfilled).count
    }
  end

  def index_users
    totals = Referral.group(:referrer_id).count
    eligibles = Referral.eligible.group(:referrer_id).count
    approveds = Referral.approved.group(:referrer_id).count
    pins = ReferralPin.group(:user_id).count
    referrer_ids = totals.keys
    users_by_id = User.where(id: referrer_ids).index_by(&:id)

    referrer_ids.sort_by { |id| -totals[id] }.map { |id|
      u = users_by_id[id]
      next unless u

      {
        id: u.id,
        display_name: u.display_name,
        avatar: u.avatar,
        referral_code: u.referral_code,
        total: totals[id].to_i,
        eligible_count: eligibles[id].to_i,
        approved_count: approveds[id].to_i,
        pins_count: pins[id].to_i
      }
    }.compact
  end

  def serialize_referral(referral)
    {
      id: referral.id,
      status: referral.status,
      referred: {
        id: referral.referred.id,
        display_name: referral.referred.display_name,
        avatar: referral.referred.avatar
      },
      qualifying_project: referral.qualifying_project && {
        id: referral.qualifying_project.id,
        name: referral.qualifying_project.name
      },
      eligible_at: referral.eligible_at&.strftime("%b %d, %Y %H:%M"),
      approved_at: referral.approved_at&.strftime("%b %d, %Y %H:%M"),
      created_at: referral.created_at.strftime("%b %d, %Y")
    }
  end

  def serialize_pin(pin)
    {
      id: pin.id,
      milestone: pin.milestone,
      order_id: pin.order_id,
      order_status: pin.order.status,
      earned_at: pin.created_at.strftime("%b %d, %Y"),
      shipped_at: pin.order.fulfilled_at&.strftime("%b %d, %Y")
    }
  end
end
