require "test_helper"

class RelightControllerTest < ActionDispatch::IntegrationTest
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

  test "404 when flag off for regular user" do
    sign_in_as(make_user)
    get relight_path
    assert_response :not_found
  end

  test "renders for admin while flag off" do
    sign_in_as(make_user(roles: [ "admin" ]))
    get relight_path
    assert_response :success
  end

  test "renders for regular user when flag on" do
    FeatureFlag.create!(name: "relight", enabled: true)
    sign_in_as(make_user)
    get relight_path
    assert_response :success
  end

  test "redirects logged out visitors" do
    get relight_path
    assert_response :redirect
  end

  test "unguilded user is not bounced to guild choice" do
    FeatureFlag.create!(name: "relight", enabled: true)
    FeatureFlag.create!(name: "guilds", enabled: true)
    sign_in_as(make_user(guild: nil))

    get relight_path
    assert_response :success

    get leaderboard_path
    assert_redirected_to new_guild_choice_path
  end
end
