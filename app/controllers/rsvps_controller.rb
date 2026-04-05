class RsvpsController < ApplicationController
  allow_unauthenticated_access only: %i[index create]
  skip_before_action :verify_authenticity_token, only: :create
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { render json: { error: "Too many requests. Try again later." }, status: :too_many_requests }

  def index
    render inertia: "Rsvp/Index"
  end

  def create
    email = params[:email].to_s.strip.downcase

    unless email.match?(URI::MailTo::EMAIL_REGEXP)
      render json: { error: "Please enter a valid email address." }, status: :unprocessable_entity
      return
    end

    rsvp = Rsvp.find_or_initialize_by(email: email)
    is_new = rsvp.new_record?

    if rsvp.save
      RsvpMailer.welcome(email).deliver_later if is_new
      render json: { ok: true }
    else
      render json: { error: rsvp.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end
end
