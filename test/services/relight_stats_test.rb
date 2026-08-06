require "test_helper"

class RelightStatsTest < ActiveSupport::TestCase
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

  def make_devlog(user, hours:, created_at: RelightStats::START_AT + 1.day, project_attrs: {})
    project = Project.create!({ user: user, name: "P #{SecureRandom.hex(4)}", tier: "tier_4", status: :draft }.merge(project_attrs))
    Devlog.create!(project: project, user: user, title: "Log", content: "Worked on things", time_hours: hours, created_at: created_at)
  end

  test "total counts only in-window devlogs on visible projects" do
    user = make_user
    make_devlog(user, hours: 3)
    make_devlog(user, hours: 5, created_at: RelightStats::START_AT - 1.day)
    make_devlog(user, hours: 7, project_attrs: { hidden: true })
    make_devlog(user, hours: 9, project_attrs: { shadow_banned: true })
    make_devlog(user, hours: 11, project_attrs: { discarded_at: Time.current })

    assert_equal 3.0, RelightStats.new.shared_props[:total_hours]
  end

  test "visual percent follows the curve" do
    assert_equal 0.0, RelightStats.curved_percent(0.0)
    assert_in_delta 22.55, RelightStats.curved_percent(1_000.0), 0.1
    assert_equal 100.0, RelightStats.curved_percent(15_000.0)
  end

  test "milestones flag reached thresholds" do
    user = make_user
    make_devlog(user, hours: 1_200)

    milestones = RelightStats.new.shared_props[:milestones]
    reached = milestones.select { |m| m[:reached] }.map { |m| m[:name] }
    assert_equal [ "Cold Coals", "First Embers" ], reached
    assert milestones.all? { |m| m.key?(:visual_position) }
  end

  test "ember feed serializes recent devlogs" do
    user = make_user
    devlog = make_devlog(user, hours: 2.5)

    feed = RelightStats.new.shared_props[:ember_feed]
    assert_equal 1, feed.length
    entry = feed.first
    assert_equal devlog.id, entry[:id]
    assert_equal 2.5, entry[:hours]
    assert_equal user.display_name, entry[:user][:display_name]
    assert_equal devlog.project.name, entry[:project][:name]
  end

  test "guild race groups trailing week hours by author guild" do
    elf = make_user(guild: :rivendell)
    dwarf = make_user(guild: :erebor)
    make_devlog(elf, hours: 6, created_at: 1.hour.ago)
    make_devlog(dwarf, hours: 2, created_at: 1.hour.ago)
    make_devlog(elf, hours: 4, created_at: 8.days.ago)

    race = RelightStats.new.shared_props[:guild_race]
    assert_equal "rivendell", race.first[:name]
    assert_equal 6.0, race.first[:hours]
    assert_equal 75.0, race.first[:share]
    assert_equal 2.0, race.find { |r| r[:name] == "erebor" }[:hours]
  end

  test "personal hours sums only the user's in-window devlogs" do
    user = make_user
    other = make_user
    make_devlog(user, hours: 3)
    make_devlog(user, hours: 2, created_at: RelightStats::END_AT + 1.day)
    make_devlog(other, hours: 10)

    assert_equal 3.0, RelightStats.personal_hours(user)
  end
end
