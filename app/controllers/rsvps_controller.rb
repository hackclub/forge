class RsvpsController < ApplicationController
  allow_unauthenticated_access only: %i[index create]
  skip_before_action :verify_authenticity_token, only: :create
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { render json: { error: "Too many requests. Try again later." }, status: :too_many_requests }

  def index
    render inertia: "Rsvp/Index"
  end

  def referral
    return redirect_to "/rsvp" unless current_user

    referrals = current_user.referrals_made.includes(:referred).order(created_at: :desc)

    render inertia: "Rsvp/Referral", props: {
      referral_code: current_user.referral_code,
      referral_url: referral_signup_url(current_user.referral_code),
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
          created_at: r.created_at.strftime("%b %d, %Y")
        }
      }
    }
  end

  def create
    email = params[:email].to_s.strip.downcase

    unless email.match?(URI::MailTo::EMAIL_REGEXP)
      render json: { error: "Please enter a valid email address." }, status: :unprocessable_entity
      return
    end

    rsvp = Rsvp.find_or_initialize_by(email: email)

    if rsvp.save
      render json: { ok: true }
    else
      render json: { error: rsvp.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def referral_signup_url(code)
    "#{ENV.fetch('APP_URL', request.base_url)}/auth/hca/start?ref=#{code}"
  end
end
