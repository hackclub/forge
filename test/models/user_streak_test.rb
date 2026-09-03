require "test_helper"

class UserStreakTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @user.update!(streak_freezes: 1)
    @project = projects(:one)
    @today = @user.today_in_zone
  end

  def active_day(date)
    @user.streak_days.create!(date: date, status: :active)
  end

  def journal(date, hours)
    @project.devlogs.create!(
      user: @user,
      title: "Entry #{date} #{hours}",
      content: "worked on it",
      entry_date: date,
      time_hours: hours
    )
  end

  test "freeze fills a real missed day" do
    active_day(@today - 2)
    journal(@today, 1.5)

    assert_equal 0, @user.reload.streak_freezes
    assert @user.streak_days.find_by(date: @today - 1).status_frozen?
    assert_equal 3, @user.current_streak
  end

  test "a day under the hours minimum does not count" do
    active_day(@today - 1)
    journal(@today, 0.5)

    assert @user.streak_days.find_by(date: @today).status_pending?
    assert_equal 0.5, @user.streak_days.find_by(date: @today).hours_logged.to_f
    assert_equal 1, @user.current_streak
  end

  test "several short entries add up to earn the day" do
    journal(@today, 0.5)
    journal(@today, 0.75)

    assert @user.streak_days.find_by(date: @today).status_active?
    assert_equal 1.25, @user.streak_days.find_by(date: @today).hours_logged.to_f
  end

  test "hours arriving late promote a day already marked missed" do
    active_day(@today - 2)
    @user.update!(streak_freezes: 0)
    @user.apply_streak_freezes!

    assert @user.streak_days.find_by(date: @today - 1).status_missed?

    journal(@today - 1, 2.0)

    assert @user.streak_days.find_by(date: @today - 1).status_active?
  end

  test "hours older than the backfill window cannot revive history" do
    stale = @today - 5
    @user.streak_days.create!(date: stale, status: :missed)
    journal(stale, 4.0)

    assert @user.streak_days.find_by(date: stale).status_missed?
  end

  test "days before the hours requirement keep the any-activity rule" do
    legacy = StreakService::HOURS_REQUIRED_FROM - 1
    StreakService.recompute_day(@user, legacy, today: legacy)

    assert_nil @user.streak_days.find_by(date: legacy)

    journal(legacy, 0.25)
    StreakService.recompute_day(@user, legacy, today: legacy)

    assert @user.streak_days.find_by(date: legacy).status_active?
  end

  test "an already-counting day is never demoted by a recompute" do
    active_day(@today)
    StreakService.recompute_day(@user, @today)

    assert @user.streak_days.find_by(date: @today).status_active?
  end

  test "past-dated journal credit does not burn freezes on historical gaps" do
    active_day(@today - 12)
    active_day(@today)
    @user.record_activity!(@today - 10)

    assert_equal 1, @user.reload.streak_freezes
  end

  test "future-dated journal credit is clamped to today and burns no freezes" do
    active_day(@today)
    @user.record_activity!(@today + 3)

    assert_not @user.streak_days.exists?(date: @today + 3)
    assert_equal 1, @user.reload.streak_freezes
  end

  test "does not burn freezes on a gap too big to bridge" do
    active_day(@today - 5)
    journal(@today, 1.0)

    assert_equal 1, @user.reload.streak_freezes
    assert_equal 1, @user.current_streak
    assert @user.streak_days.find_by(date: @today - 1).status_missed?
  end

  test "record_activity! is idempotent and still applies freezes" do
    active_day(@today - 2)
    journal(@today, 1.0)
    @user.record_activity!

    assert_equal 0, @user.reload.streak_freezes
    assert_equal 3, @user.current_streak
  end

  test "buying a freeze later reclaims a missed day" do
    @user.update!(streak_freezes: 0)
    active_day(@today - 2)
    journal(@today, 1.0)

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

  # --- reconcile_missed_days query cost -----------------------------------
  #
  # This ran one SELECT per day since the user's last counting day, on every
  # request that touched their streak. Because marking days `missed` does not
  # move that cursor, the same days were re-read and discarded forever, growing
  # by a query a day: a 96-day gap cost 100 queries and ~1s of database time on
  # every page load.

  def count_queries
    count = 0
    sub = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
      count += 1 unless payload[:name].to_s.match?(/SCHEMA|TRANSACTION/)
    end
    yield
    count
  ensure
    ActiveSupport::Notifications.unsubscribe(sub)
  end

  test "a long gap is resolved in a handful of queries, not one per day" do
    @user.update!(streak_freezes: 0)
    active_day(@today - 90)

    queries = count_queries { StreakService.reconcile_missed_days(@user, @today) }

    assert_operator queries, :<, 15, "expected a batched write, got #{queries} queries for an 89-day gap"
    assert_equal 89, @user.streak_days.where(status: :missed).count
  end

  test "re-running over an already-resolved gap writes nothing and stays cheap" do
    @user.update!(streak_freezes: 0)
    active_day(@today - 90)
    StreakService.reconcile_missed_days(@user, @today)

    before = @user.streak_days.order(:date).pluck(:date, :status, :hours_logged)
    queries = count_queries { StreakService.reconcile_missed_days(@user, @today) }

    assert_operator queries, :<, 10, "steady state should be nearly free, got #{queries} queries"
    assert_equal before, @user.streak_days.reload.order(:date).pluck(:date, :status, :hours_logged)
  end

  test "marking a gap missed preserves created_at and hours on existing rows" do
    @user.update!(streak_freezes: 0)
    active_day(@today - 5)
    stamped = @user.streak_days.create!(
      date: @today - 3, status: :pending, hours_logged: 0.4, created_at: 10.days.ago
    )

    StreakService.reconcile_missed_days(@user, @today)
    stamped.reload

    assert stamped.status_missed?
    assert_equal 0.4, stamped.hours_logged.to_f
    assert_in_delta 10.days.ago.to_i, stamped.created_at.to_i, 5
  end

  test "a bridged gap is frozen in one batch and still spends the freezes" do
    active_day(@today - 3)
    @user.update!(streak_freezes: 2)

    queries = count_queries { StreakService.reconcile_missed_days(@user, @today) }

    assert_operator queries, :<, 15
    assert_equal 2, @user.streak_days.where(status: :frozen).count
    assert_equal 0, @user.reload.streak_freezes
  end
end
