require "test_helper"

class ComputeGuildMultipliersJobTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  def make_user(attrs = {})
    token = SecureRandom.hex(6)
    User.create!({
      avatar: "avatar",
      display_name: "User #{token}",
      email: "#{token}@example.com",
      timezone: "UTC",
      slack_id: "S#{token}",
      hca_id: "H#{token}",
      roles: [ "user" ]
    }.merge(attrs))
  end

  test "counts referrals the guild brought in this week without requiring approval" do
    referrer = make_user(guild: :rivendell)
    Referral.create!(referrer: referrer, referred: make_user, status: :pending)
    Referral.create!(referrer: referrer, referred: make_user, status: :eligible)

    counts = ComputeGuildMultipliersJob.new.recompute_guild!("rivendell")

    state = GuildState.find_by(guild: :rivendell)
    assert_equal 2, state.referrals_week, "pending/eligible referrals should still count"
    assert_equal 2, counts[referrer.id]
    assert_operator state.multiplier.to_f, :>, 1.0, "multiplier should rise above the floor"
  end

  test "ignores referrals brought in before the 7-day window" do
    referrer = make_user(guild: :erebor)
    old = Referral.create!(referrer: referrer, referred: make_user, status: :approved)
    old.update_column(:created_at, 10.days.ago)

    ComputeGuildMultipliersJob.new.recompute_guild!("erebor")

    state = GuildState.find_by(guild: :erebor)
    assert_equal 0, state.referrals_week
    assert_equal 1.0, state.multiplier.to_f
  end

  test "creating a referral enqueues a live recompute for the referrer's guild" do
    referrer = make_user(guild: :edoras)

    assert_enqueued_jobs 1, only: ComputeGuildMultipliersJob do
      Referral.create!(referrer: referrer, referred: make_user, status: :pending)
    end
  end

  test "does not enqueue a recompute when the referrer is not in a guild" do
    referrer = make_user # no guild

    assert_no_enqueued_jobs only: ComputeGuildMultipliersJob do
      Referral.create!(referrer: referrer, referred: make_user, status: :pending)
    end
  end
end
