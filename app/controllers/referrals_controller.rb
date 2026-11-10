class ReferralsController < ApplicationController
  def index
    referrals = current_user.referrals_made.includes(:referred).order(created_at: :desc)
    pins = current_user.referral_pins.includes(:order).order(milestone: :desc)
    approved = referrals.count(&:approved?)

    render inertia: "Referrals/Index", props: {
      referral_code: current_user.referral_code,
      referral_url: "#{ENV.fetch('APP_URL', request.base_url)}/auth/hca/start?ref=#{current_user.referral_code}",
      pin_threshold: Referral::PIN_THRESHOLD,
      stats: {
        total: referrals.size,
        pending: referrals.count(&:pending?),
        eligible: referrals.count(&:eligible?),
        approved: approved,
        pins_earned: pins.size,
        progress: approved % Referral::PIN_THRESHOLD
      },
      referrals: referrals.map { |r|
        {
          id: r.id,
          status: r.status,
          display_name: r.referred.display_name,
          avatar: r.referred.avatar,
          created_at: r.created_at.strftime("%b %d, %Y")
        }
      },
      pins: pins.map { |p|
        {
          id: p.id,
          milestone: p.milestone,
          status: p.shipped? ? "shipped" : "pending",
          earned_at: p.created_at.strftime("%b %d, %Y"),
          shipped_at: p.order.fulfilled_at&.strftime("%b %d, %Y")
        }
      }
    }
  end
end
