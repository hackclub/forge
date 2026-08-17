require "test_helper"

class UserStreakTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @user.update!(streak_freezes: 1)
    @today = @user.today_in_zone
  end

  def active_day(date)
    @user.streak_days.create!(date: date, status: :active)
  end

  test "freeze fills a real missed day" do
    active_day(@today - 2)
    @user.record_activity!

    assert_equal 0, @user.reload.streak_freezes
    assert @user.streak_days.find_by(date: @today - 1).status_frozen?
    assert_equal 3, @user.current_streak
  end

  test "past-dated journal credit does not burn freezes on historical gaps" do
    active_day(@today - 12)
    active_day(@today)
    @user.record_activity!(@today - 10)

    assert_equal 1, @user.reload.streak_freezes
    assert @user.streak_days.find_by(date: @today - 10).status_active?
  end

  test "future-dated journal credit is clamped to today and burns no freezes" do
    active_day(@today)
    @user.record_activity!(@today + 3)

    assert_not @user.streak_days.exists?(date: @today + 3)
    assert_equal 1, @user.reload.streak_freezes
  end

  test "does not burn freezes on a gap too big to bridge" do
    active_day(@today - 5)
    @user.record_activity!

    assert_equal 1, @user.reload.streak_freezes
    assert_equal 1, @user.current_streak
    assert @user.streak_days.find_by(date: @today - 1).status_missed?
  end

  test "record_activity! is idempotent and still applies freezes" do
    active_day(@today - 2)
    @user.record_activity!
    @user.record_activity!

    assert_equal 0, @user.reload.streak_freezes
    assert_equal 3, @user.current_streak
  end

  test "buying a freeze later reclaims a missed day" do
    @user.update!(streak_freezes: 0)
    active_day(@today - 2)
    @user.record_activity!

    assert @user.streak_days.find_by(date: @today - 1).status_missed?
    assert_equal 1, @user.current_streak

    @user.update!(streak_freezes: 1)
    @user.apply_streak_freezes!

    assert_equal 0, @user.reload.streak_freezes
    assert @user.streak_days.find_by(date: @today - 1).status_frozen?
    assert_equal 3, @user.current_streak
  end

  test "missed days do not count toward the longest streak" do
    active_day(@today - 4)
    active_day(@today - 3)
    @user.streak_days.create!(date: @today - 2, status: :missed)
    active_day(@today - 1)
    active_day(@today)

    assert_equal 2, @user.longest_streak
  end
end
