require "test_helper"

class SettingsTimezoneTest < ActionDispatch::IntegrationTest
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
      onboarded_at: Time.current
    }.merge(attrs))
  end

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  test "setting a timezone stores the identifier and marks it manual" do
    user = make_user
    sign_in_as(user)

    patch settings_timezone_path, params: { timezone: "America/New_York" }

    user.reload
    assert_equal "America/New_York", user.timezone
    assert user.timezone_manually_set?
  end

  test "a friendly zone name is normalised to its identifier" do
    user = make_user
    sign_in_as(user)

    patch settings_timezone_path, params: { timezone: "Eastern Time (US & Canada)" }

    assert_equal "America/New_York", user.reload.timezone
  end

  test "an unrecognised timezone is rejected and changes nothing" do
    user = make_user(timezone: "Europe/London")
    sign_in_as(user)

    patch settings_timezone_path, params: { timezone: "Not/AZone" }

    user.reload
    assert_equal "Europe/London", user.timezone
    assert_not user.timezone_manually_set?
  end

  test "the streak day rolls over at midnight in the chosen timezone" do
    user = make_user(timezone: "America/New_York")

    travel_to Time.utc(2026, 8, 23, 3, 30) do
      assert_equal Date.new(2026, 8, 22), user.today_in_zone
    end

    travel_to Time.utc(2026, 8, 23, 4, 30) do
      assert_equal Date.new(2026, 8, 23), user.today_in_zone
    end
  end

  test "a manually set timezone survives a Slack profile refresh" do
    user = make_user(timezone: "America/New_York", timezone_manually_set: true)

    with_slack_tz("Asia/Tokyo") { user.refresh_profile_from_slack }

    assert_equal "America/New_York", user.reload.timezone
  end

  test "an unset timezone still syncs from Slack" do
    user = make_user(timezone: "UTC")

    with_slack_tz("Asia/Tokyo") { user.refresh_profile_from_slack }

    assert_equal "Asia/Tokyo", user.reload.timezone
  end

  def with_slack_tz(tz)
    profile = Struct.new(:display_name, :image_192, :image_512, :image_72, :image_48, :image_32, :image_24, :image_original)
      .new("Slack Name", nil, nil, nil, nil, nil, nil, nil)
    info = Struct.new(:user).new(Struct.new(:profile, :tz).new(profile, tz))

    original = User.method(:fetch_slack_user_info)
    User.define_singleton_method(:fetch_slack_user_info) { |*_| info }
    yield
  ensure
    User.define_singleton_method(:fetch_slack_user_info, original)
  end
end
