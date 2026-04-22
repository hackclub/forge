class Admin::ReferralsController < Admin::ApplicationController
  before_action :require_referrals_permission!

  def index
    render inertia: "Admin/Referrals/Index", props: {
      users: index_users,
      stats: dashboard_stats,
      winner: flash[:winner]
    }
  end

  def show
    @user = User.find(params[:id])
    referrals = @user.referrals_made.includes(:referred, :qualifying_project).order(created_at: :desc)

    render inertia: "Admin/Referrals/Show", props: {
      user: {
        id: @user.id,
        display_name: @user.display_name,
        avatar: @user.avatar,
        referral_code: @user.referral_code
      },
      referrals: referrals.map { |r| serialize_referral(r) },
      stats: dashboard_stats
    }
  end

  def approve_one
    referral = Referral.find(params[:referral_id])
    unless referral.eligible?
      redirect_to admin_referral_path(referral.referrer_id), alert: "Referral is not eligible for payout."
      return
    end

    referral.approve!(actor: current_user)
    audit!("referral.approved", target: referral.referrer, metadata: {
      referral_id: referral.id,
      referred_id: referral.referred_id,
      payout: Referral::PAYOUT_AMOUNT
    })
    redirect_to admin_referral_path(referral.referrer_id), notice: "Referral approved and paid out."
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

  def draw_winner
    approved = Referral.approved.includes(:referrer)
    tickets = approved.map(&:referrer).reject(&:nil?)

    if tickets.empty?
      redirect_to admin_referrals_path, alert: "No eligible entrants for the draw."
      return
    end

    winner = tickets.sample
    pool_amount = ReferralPrizePool.instance.amount
    audit!("referral.winner_drawn", target: winner, metadata: { pool_amount: pool_amount, ticket_count: tickets.size })

    flash[:winner] = {
      id: winner.id,
      display_name: winner.display_name,
      avatar: winner.avatar,
      tickets: tickets.count(winner),
      pool_amount: pool_amount.to_f
    }
    redirect_to admin_referrals_path
  end

  def reset_pool
    pool = ReferralPrizePool.instance
    previous = pool.reset!
    audit!("referral.pool_reset", metadata: { previous_amount: previous.to_f })
    redirect_to admin_referrals_path, notice: "Prize pool reset. Previous balance: #{previous.to_f}c."
  end

  private

  def require_referrals_permission!
    require_permission!("referrals")
  end

  def dashboard_stats
    pool = ReferralPrizePool.instance
    approved_count = Referral.approved.count
    eligible_count = Referral.eligible.count
    {
      total_unique_referrals: Referral.count,
      approved_count: approved_count,
      eligible_count: eligible_count,
      pending_count: Referral.pending.count,
      prize_pool: pool.amount.to_f,
      total_paid_out_to_pool: pool.total_paid_out.to_f,
      total_referral_spend: (approved_count * (Referral::PAYOUT_AMOUNT + Referral::PRIZE_POOL_CONTRIBUTION)).round(2)
    }
  end

  def index_users
    totals = Referral.group(:referrer_id).count
    eligibles = Referral.eligible.group(:referrer_id).count
    approveds = Referral.approved.group(:referrer_id).count
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
        approved_count: approveds[id].to_i
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
end
