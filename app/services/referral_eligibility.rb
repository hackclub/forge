class ReferralEligibility
  def self.mark(project)
    referral = project.user.referral_received
    return unless referral&.pending?

    referral.mark_eligible!(project)
  end
end
