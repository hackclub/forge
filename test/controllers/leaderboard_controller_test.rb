require "test_helper"

class LeaderboardControllerTest < ActionDispatch::IntegrationTest
  def make_user(attrs = {})
    token = SecureRandom.hex(6)
    User.create!({
      avatar: "avatar",
      display_name: "User #{token}",
      email: "#{token}@example.com",
      timezone: "UTC",
      slack_id: "S#{token}",
      hca_id: "H#{token}",
      roles: [ "user" ],
      birthday: 20.years.ago.to_date,
      onboarded_at: Time.current,
      guild: :rivendell
    }.merge(attrs))
  end

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  test "guild referral tallies count each referrer's guild" do
    erebor = make_user(guild: :erebor)
    Referral.create!(referrer: erebor, referred: make_user(guild: nil), status: :pending)
    Referral.create!(referrer: erebor, referred: make_user(guild: nil), status: :approved)

    sign_in_as(make_user(guild: :erebor))
    get leaderboard_path

    assert_response :success
    tallies = inertia.props[:guild_referrals].index_by { |row| row[:name] }
    assert_equal 2, tallies["erebor"][:value]
    assert_equal 0, tallies["valinor"][:value]
  end
end
