require "test_helper"

class DevlogsLapseUrlTest < ActionDispatch::IntegrationTest
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
    @owner = make_user
    @project = @owner.projects.create!(name: "Macropad", tier: "tier_4", status: :draft, devlog_mode: "website")
    @devlog = @project.devlogs.create!(user: @owner, title: "Entry", content: "Did things", lapse_url: "https://lapse.hackclub.com/timelapse/abc")
  end

  test "an anonymous visitor does not see the lapse_url on the project page" do
    get project_path(@project)

    assert_response :success
    entry = inertia.props[:devlogs].find { |d| d[:id] == @devlog.id }
    assert_nil entry[:lapse_url]
  end

  test "a random signed-in user does not see the lapse_url" do
    sign_in_as(make_user)

    get project_path(@project)

    entry = inertia.props[:devlogs].find { |d| d[:id] == @devlog.id }
    assert_nil entry[:lapse_url]
  end

  test "the project owner sees the lapse_url" do
    sign_in_as(@owner)

    get project_path(@project)

    entry = inertia.props[:devlogs].find { |d| d[:id] == @devlog.id }
    assert_equal @devlog.lapse_url, entry[:lapse_url]
  end

  test "an admin sees the lapse_url" do
    sign_in_as(make_user(roles: [ "admin" ]))

    get project_path(@project)

    entry = inertia.props[:devlogs].find { |d| d[:id] == @devlog.id }
    assert_equal @devlog.lapse_url, entry[:lapse_url]
  end

  test "a reviewer sees the lapse_url" do
    sign_in_as(make_user(roles: [ "reviewer" ]))

    get project_path(@project)

    entry = inertia.props[:devlogs].find { |d| d[:id] == @devlog.id }
    assert_equal @devlog.lapse_url, entry[:lapse_url]
  end

  test "the single devlog page also hides the lapse_url from unauthorized viewers" do
    get project_devlog_path(@project, @devlog)

    assert_response :success
    assert_nil inertia.props[:devlog][:lapse_url]
  end

  test "a git-mode devlog update can only change the lapse_url, even if other fields are submitted" do
    @project.update!(devlog_mode: "git")
    @devlog.update!(title: "Original", content: "Original content", time_spent: "1 hour")
    sign_in_as(@owner)

    patch project_devlog_path(@project, @devlog), params: {
      devlog: { title: "Hijacked", content: "Hijacked content", time_spent: "99 hours", lapse_url: "https://lapse.hackclub.com/timelapse/new" }
    }

    @devlog.reload
    assert_equal "Original", @devlog.title
    assert_equal "Original content", @devlog.content
    assert_equal "1 hour", @devlog.time_spent
    assert_equal "https://lapse.hackclub.com/timelapse/new", @devlog.lapse_url
  end

  test "a website-mode devlog update can still change all fields" do
    sign_in_as(@owner)

    content = "Updated content describing what was built in plenty of detail. " * 3 + "![screenshot](https://example.com/a.png)"
    patch project_devlog_path(@project, @devlog), params: {
      devlog: { title: "Updated", content: content, time_spent: "2 hours", lapse_url: "https://lapse.hackclub.com/timelapse/new" }
    }

    @devlog.reload
    assert_equal "Updated", @devlog.title
    assert_equal "https://lapse.hackclub.com/timelapse/new", @devlog.lapse_url
  end
end
