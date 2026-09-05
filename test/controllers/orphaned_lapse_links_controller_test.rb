require "test_helper"

class OrphanedLapseLinksControllerTest < ActionDispatch::IntegrationTest
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
    @project = @owner.projects.create!(name: "Macropad", tier: "tier_4", status: :draft, devlog_mode: "git")
    @devlog = @project.devlogs.create!(user: @owner, title: "Soldering", content: "Soldered joints")
    @link = @project.orphaned_lapse_links.create!(title: "Wiring", lapse_url: "https://lapse.hackclub.com/timelapse/old")
  end

  test "the owner can relink an unmatched link onto a devlog" do
    sign_in_as(@owner)

    patch relink_project_orphaned_lapse_link_path(@project, @link), params: { devlog_id: @devlog.id }

    assert_redirected_to project_path(@project)
    assert_equal "https://lapse.hackclub.com/timelapse/old", @devlog.reload.lapse_url
    assert_not OrphanedLapseLink.exists?(@link.id)
  end

  test "the owner can delete an unmatched link they no longer need" do
    sign_in_as(@owner)

    delete project_orphaned_lapse_link_path(@project, @link)

    assert_redirected_to project_path(@project)
    assert_not OrphanedLapseLink.exists?(@link.id)
  end

  test "a random signed-in user cannot relink or delete" do
    sign_in_as(make_user)

    patch relink_project_orphaned_lapse_link_path(@project, @link), params: { devlog_id: @devlog.id }
    assert_nil @devlog.reload.lapse_url
    assert OrphanedLapseLink.exists?(@link.id)

    delete project_orphaned_lapse_link_path(@project, @link)
    assert OrphanedLapseLink.exists?(@link.id)
  end

  test "an admin can relink and delete" do
    sign_in_as(make_user(roles: [ "admin" ]))

    patch relink_project_orphaned_lapse_link_path(@project, @link), params: { devlog_id: @devlog.id }

    assert_equal "https://lapse.hackclub.com/timelapse/old", @devlog.reload.lapse_url
  end
end
