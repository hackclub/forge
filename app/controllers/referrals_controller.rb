class ReferralsController < ApplicationController
  def index
    referrals = current_user.referrals_made.includes(:referred, :payout_adjustment).order(created_at: :desc)

    render inertia: "Referrals/Index", props: {
      referral_code: current_user.referral_code,
      referral_url: "#{ENV.fetch('APP_URL', request.base_url)}/auth/hca/start?ref=#{current_user.referral_code}",
      stats: {
        total: referrals.size,
        pending: referrals.count(&:pending?),
        eligible: referrals.count(&:eligible?),
        approved: referrals.count(&:approved?),
        earned: (referrals.count(&:approved?) * Referral::PAYOUT_AMOUNT).round(2)
      },
      referrals: referrals.map { |r|
        {
          id: r.id,
          status: r.status,
          display_name: r.referred.display_name,
          avatar: r.referred.avatar,
          created_at: r.created_at.strftime("%b %d, %Y"),
          payout: r.payout_adjustment&.amount&.to_f
        }
      }
    }
  end
end
