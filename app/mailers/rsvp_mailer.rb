class RsvpMailer < ApplicationMailer
  default from: "Aarav from Forge <aarav@hackclub.com>"

  def welcome(email)
    @email = email
    mail(to: email, subject: "🔥 You're on the Forge list") do |format|
      format.html { render layout: false }
    end
  end
end
