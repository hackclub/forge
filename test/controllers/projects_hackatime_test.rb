require "test_helper"

class ProjectsHackatimeTest < ActionDispatch::IntegrationTest
  SAMPLE = [
    { name: "forge", seconds: 7200, languages: [ "Ruby" ], repo: "https://github.com/x/forge", last_heartbeat: nil },
    { name: "keyboard-fw", seconds: 900, languages: [ "C" ], repo: nil, last_heartbeat: nil }
  ].freeze

  attr_accessor :requested_lookup

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

  def with_hackatime(enabled:, user_id: 35, projects: SAMPLE)
    was_enabled = HackatimeService.method(:enabled?)
    was_find = HackatimeService.method(:find_user_id)
    was_projects = HackatimeService.method(:get_user_projects)
    test = self

    HackatimeService.define_singleton_method(:enabled?) { enabled }
    HackatimeService.define_singleton_method(:find_user_id) do |slack_id:, email:|
      test.requested_lookup = { slack_id: slack_id, email: email }
      user_id
    end
    HackatimeService.define_singleton_method(:get_user_projects) { |_id| projects }
    yield
  ensure
    HackatimeService.define_singleton_method(:enabled?, was_enabled)
    HackatimeService.define_singleton_method(:find_user_id, was_find)
    HackatimeService.define_singleton_method(:get_user_projects, was_projects)
  end

  test "lists the signed-in user's hackatime projects without asking for an id" do
    user = make_user
    sign_in_as(user)

    with_hackatime(enabled: true) { get hackatime_projects_projects_path }

    assert_response :success
    assert_equal({ slack_id: user.slack_id, email: user.email }, requested_lookup)
    names = JSON.parse(response.body)["projects"].map { |p| p["name"] }
    assert_equal [ "forge", "keyboard-fw" ], names
  end

  test "reports when no hackatime account matches the signed-in user" do
    sign_in_as(make_user)

    with_hackatime(enabled: true, user_id: nil) { get hackatime_projects_projects_path }

    assert_response :not_found
    assert_match "couldn't find a Hackatime account", JSON.parse(response.body)["error"]
  end

  test "reports when hackatime is not configured" do
    sign_in_as(make_user)

    with_hackatime(enabled: false) { get hackatime_projects_projects_path }

    assert_response :service_unavailable
    assert_match "not configured", JSON.parse(response.body)["error"]
  end

  test "still resolves by email when the account has no slack id" do
    user = make_user
    sign_in_as(user)
    user.update_column(:slack_id, "")

    with_hackatime(enabled: true) { get hackatime_projects_projects_path }

    assert_response :success
    assert_equal user.email, requested_lookup[:email]
  end

  test "requires signing in" do
    get hackatime_projects_projects_path
    assert_response :redirect
  end

  test "linked hackatime projects are saved on the project" do
    user = make_user
    project = user.projects.create!(name: "Macropad", tier: "tier_4", status: :draft)
    sign_in_as(user)

    patch project_path(project), params: { project: { hackatime_projects: [ "forge", "keyboard-fw" ] } }

    assert_equal [ "forge", "keyboard-fw" ], project.reload.hackatime_projects
  end

  test "clearing every selection stores an empty list" do
    user = make_user
    project = user.projects.create!(name: "Macropad", tier: "tier_4", status: :draft, hackatime_projects: [ "forge" ])
    sign_in_as(user)

    patch project_path(project), params: { project: { hackatime_projects: [ "" ] } }

    assert_empty project.reload.hackatime_projects
  end

  test "duplicate and padded names are normalized" do
    user = make_user
    project = user.projects.create!(name: "Macropad", tier: "tier_4", status: :draft)

    project.update!(hackatime_projects: [ " forge ", "forge", "keyboard-fw" ])

    assert_equal [ "forge", "keyboard-fw" ], project.reload.hackatime_projects
  end
end
