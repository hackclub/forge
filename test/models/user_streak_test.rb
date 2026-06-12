require "test_helper"

class UserStreakTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @user.update!(streak_freezes: 1)
    @today = @user.today_in_zone
  end

  test "freeze fills a real missed day" do
    @user.activity_days.create!(active_on: @today - 2)
    @user.record_activity!

    assert_equal 0, @user.reload.streak_freezes
    assert @user.activity_days.exists?(active_on: @today - 1)
    assert_equal 3, @user.current_streak
  end

  test "past-dated journal credit does not burn freezes on historical gaps" do
    # activity 12 days ago, journal sync credits an entry dated 10 days ago,
    # user is otherwise active today — no real gap, freeze must survive
    @user.activity_days.create!(active_on: @today - 12)
    @user.activity_days.create!(active_on: @today)
    @user.record_activity!(@today - 10)

    assert_equal 1, @user.reload.streak_freezes
  end

  test "future-dated journal credit is clamped to today and burns no freezes" do
    @user.activity_days.create!(active_on: @today)
    @user.record_activity!(@today + 3)

    assert_not @user.activity_days.exists?(active_on: @today + 3)
    assert_equal 1, @user.reload.streak_freezes
  end

  test "does not burn freezes on a gap too big to bridge" do
    @user.activity_days.create!(active_on: @today - 5)
    @user.record_activity!

    assert_equal 1, @user.reload.streak_freezes
    assert_equal 1, @user.current_streak
  end

  test "record_activity! is idempotent and still applies freezes" do
    @user.activity_days.create!(active_on: @today - 2)
    @user.record_activity!
    @user.record_activity!

    assert_equal 0, @user.reload.streak_freezes
    assert_equal 3, @user.current_streak
  end
end
