require "test_helper"

class GuildsControllerTest < ActionDispatch::IntegrationTest
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

  setup do
    FeatureFlag.create!(name: "guilds", enabled: true)
  end

  test "guild page credits referrals that are not approved yet" do
    referrer = make_user(guild: :erebor)
    Referral.create!(referrer: referrer, referred: make_user(guild: nil), status: :pending)
    Referral.create!(referrer: referrer, referred: make_user(guild: nil), status: :eligible)

    sign_in_as(make_user(guild: :erebor))
    get guild_path("erebor")

    assert_response :success
    top = inertia.props[:top_referrers]
    assert_equal 1, top.length
    assert_equal referrer.id, top.first[:id]
    assert_equal 2, top.first[:referrals]
  end

  test "guild leaderboard totals include referrals that are not approved yet" do
    referrer = make_user(guild: :edoras)
    Referral.create!(referrer: referrer, referred: make_user(guild: nil), status: :pending)

    sign_in_as(make_user(guild: :edoras))
    get leaderboard_guilds_path

    assert_response :success
    row = inertia.props[:rows].find { |r| r[:name] == "edoras" }
    assert_equal 1, row[:referrals_total]
  end

  test "referrals are credited to the referrer's guild not the referred user's" do
    referrer = make_user(guild: :valinor)
    Referral.create!(referrer: referrer, referred: make_user(guild: :rivendell), status: :pending)

    sign_in_as(make_user(guild: :valinor))
    get leaderboard_guilds_path

    rows = inertia.props[:rows].index_by { |r| r[:name] }
    assert_equal 1, rows["valinor"][:referrals_total]
    assert_equal 0, rows["rivendell"][:referrals_total]
  end
end
