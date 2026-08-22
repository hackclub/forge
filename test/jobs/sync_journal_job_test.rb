require "test_helper"

class SyncJournalJobTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  setup do
    @project = projects(:one)
    @user = @project.user
    @project.update!(devlog_mode: "git", repo_link: "https://github.com/example/one")
    @today = @user.today_in_zone
  end

  def run_job(journal, commit_date: nil)
    job = SyncJournalJob.new
    job.define_singleton_method(:fetch_journal) { |_parsed, _branch| journal }
    job.define_singleton_method(:journal_commit_date) { |_parsed, _branch, _today| commit_date }
    job.perform(@project.id)
  end

  test "an undated entry is credited to the day JOURNAL.md was last pushed" do
    run_job("# Built the enclosure\n\n**Total time spent: 2h**\n", commit_date: @today - 1)

    devlog = Devlog.find_by(project: @project, title: "Built the enclosure")
    assert_equal @today - 1, devlog.entry_date
    assert @user.streak_days.find_by(date: @today - 1).status_active?
  end

  test "an undated entry falls back to today when the commit date is unavailable" do
    run_job("# Built the enclosure\n\n**Total time spent: 2h**\n")

    assert_equal @today, Devlog.find_by(project: @project, title: "Built the enclosure").entry_date
  end

  test "a dated entry is credited to its own date, not the push date" do
    date = @today - 1
    run_job("# #{date.iso8601} soldering\n\n**Total time spent: 3h**\n", commit_date: @today)

    devlog = Devlog.find_by(project: @project, title: "#{date.iso8601} soldering")
    assert_equal date, devlog.entry_date
  end

  test "re-syncing picks up hours added to an entry that already exists" do
    run_job("# Wiring\n\n**Total time spent: 30m**\n", commit_date: @today)

    devlog = Devlog.find_by(project: @project, title: "Wiring")
    assert_equal 0.5, devlog.time_hours.to_f
    assert_not @user.streak_days.find_by(date: @today).status_active?

    run_job("# Wiring\n\n**Total time spent: 2h 30m**\n", commit_date: @today)

    assert_equal 2.5, devlog.reload.time_hours.to_f
    assert @user.streak_days.find_by(date: @today).status_active?
  end

  test "syncing an unchanged journal does not duplicate devlogs" do
    journal = "# Wiring\n\n**Total time spent: 2h**\n"
    run_job(journal, commit_date: @today)
    run_job(journal, commit_date: @today)

    assert_equal 1, Devlog.where(project: @project, title: "Wiring").count
  end

  test "sync stamps journal_synced_at so the sweep can skip fresh projects" do
    run_job("# Wiring\n\n**Total time spent: 2h**\n", commit_date: @today)

    assert_not_nil @project.reload.journal_synced_at
  end

  test "sync_if_stale skips a project synced within the auto-sync interval" do
    @project.update!(journal_synced_at: 1.minute.ago)

    assert_no_enqueued_jobs(only: SyncJournalJob) { SyncJournalJob.sync_if_stale(@project) }

    @project.update!(journal_synced_at: 2.hours.ago)

    assert_enqueued_with(job: SyncJournalJob, args: [ @project.id ]) { SyncJournalJob.sync_if_stale(@project) }
  end
end
