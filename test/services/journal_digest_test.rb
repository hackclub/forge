require "test_helper"

class JournalDigestTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @user = @project.user
  end

  def entry(entry_date:, hours:, content: "x" * 300, created_at: nil, lapse_url: nil, title: "Entry")
    @project.devlogs.create!(
      user: @user, title: title, content: content, time_hours: hours,
      entry_date: entry_date, lapse_url: lapse_url,
      created_at: created_at || entry_date.to_time
    )
  end

  test "reports nothing for a project with no journal" do
    digest = JournalDigest.build(@project)
    assert_equal 0, digest["entry_count"]
    assert_empty digest["weeks"]
  end

  test "totals hours and groups entries into weeks" do
    entry(entry_date: Date.new(2026, 2, 3), hours: 2.0)
    entry(entry_date: Date.new(2026, 2, 5), hours: 3.0)
    entry(entry_date: Date.new(2026, 2, 16), hours: 1.5)

    digest = JournalDigest.build(@project)
    assert_equal 3, digest["entry_count"]
    assert_equal 6.5, digest["total_hours"]
    assert_equal 2, digest["weeks"].size
    assert_equal 5.0, digest["weeks"].first["hours"]
    assert_equal "2026-02-03", digest["first_entry_on"]
    assert_equal "2026-02-16", digest["last_entry_on"]
  end

  test "flags entries claiming more than eight hours in one sitting" do
    entry(entry_date: Date.new(2026, 2, 3), hours: 12.0)
    signal = JournalDigest.build(@project)["signals"].find { |s| s["code"] == "hour_outliers" }
    assert signal
    assert_equal "warn", signal["level"]
    assert_equal 1, signal["entry_ids"].size
  end

  # "some time in lapse (writing devlogs/transferring devlogs from beest) needs
  # to be deflated" — a real Forge fine.
  test "flags entries written long after the day they describe" do
    3.times do |i|
      entry(entry_date: Date.new(2026, 2, 3 + i), hours: 1.0, created_at: Time.utc(2026, 3, 20))
    end
    signal = JournalDigest.build(@project)["signals"].find { |s| s["code"] == "backfilled" }
    assert signal, "expected backfilled entries to be flagged"
  end

  test "does not flag entries written the same day" do
    3.times { |i| entry(entry_date: Date.new(2026, 2, 3 + i), hours: 1.0) }
    assert_nil JournalDigest.build(@project)["signals"].find { |s| s["code"] == "backfilled" }
  end

  test "flags high-hour entries that say almost nothing" do
    entry(entry_date: Date.new(2026, 2, 3), hours: 4.0, content: "did stuff")
    signal = JournalDigest.build(@project)["signals"].find { |s| s["code"] == "thin_entries" }
    assert signal
  end

  test "reports gaps of a week or more between entries" do
    entry(entry_date: Date.new(2026, 2, 3), hours: 1.0)
    entry(entry_date: Date.new(2026, 3, 3), hours: 1.0)
    signal = JournalDigest.build(@project)["signals"].find { |s| s["code"] == "gaps" }
    assert signal
  end

  test "counts images and timelapse links" do
    entry(entry_date: Date.new(2026, 2, 3), hours: 1.0, content: "progress ![shot](a.png) #{'x' * 200}")
    entry(entry_date: Date.new(2026, 2, 4), hours: 1.0, lapse_url: "https://example.com/lapse")

    digest = JournalDigest.build(@project)
    assert_equal 1, digest["with_images"]
    assert_equal 1, digest["with_lapse"]
  end

  test "a 50 entry journal still condenses to a handful of weeks" do
    50.times { |i| entry(entry_date: Date.new(2026, 1, 5) + i, hours: 0.5) }
    digest = JournalDigest.build(@project)

    assert_equal 50, digest["entry_count"]
    assert_operator digest["weeks"].size, :<=, 9
    assert_equal 25.0, digest["total_hours"]
  end
end
