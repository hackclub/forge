require "test_helper"

class ProjectsAiCheckTest < ActionDispatch::IntegrationTest
  include ActiveJob::TestHelper

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

  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  test "ai_check_stale? flags an old in-progress result" do
    assert Project.new(ai_check_result: { "status" => "running", "started_at" => 20.minutes.ago.iso8601 }).ai_check_stale?
    assert Project.new(ai_check_result: { "status" => "queued", "queued_at" => 30.minutes.ago.iso8601 }).ai_check_stale?
  end

  test "ai_check_stale? leaves fresh, done, or empty results alone" do
    assert_not Project.new(ai_check_result: { "status" => "running", "started_at" => 1.minute.ago.iso8601 }).ai_check_stale?
    assert_not Project.new(ai_check_result: { "status" => "done" }).ai_check_stale?
    assert_not Project.new(ai_check_result: nil).ai_check_stale?
  end

  # Results written before the status field existed carry a full verdict but no
  # status, which left the pre-submission page with nothing to render: no
  # spinner, no results, and no re-run button to escape with.
  test "a completed result that predates the status field is reported as done" do
    legacy = {
      "overall" => "fail",
      "summary" => "Missing the BOM table.",
      "requirements" => [ { "name" => "README BOM table", "verdict" => "fail", "reasoning" => "None found.", "source" => "submitting.md" } ],
      "checked_at" => 3.months.ago.iso8601,
      "provider" => "google"
    }
    project = Project.new(ai_check_result: legacy)

    assert_not project.ai_check_stale?
    assert_equal "done", project.ai_check_result_for_display["status"]
    assert_equal "fail", project.ai_check_result_for_display["overall"]
  end

  test "a status-less result with no verdict is left alone rather than faked as done" do
    project = Project.new(ai_check_result: { "provider" => "google" })
    assert_nil project.ai_check_result_for_display["status"]
  end

  test "normalising a legacy result does not mask a real error or a live run" do
    errored = Project.new(ai_check_result: { "status" => "error", "message" => "boom", "overall" => "fail" })
    assert_equal "error", errored.ai_check_result_for_display["status"]

    running = Project.new(ai_check_result: { "status" => "running", "started_at" => 1.minute.ago.iso8601 })
    assert_equal "running", running.ai_check_result_for_display["status"]
  end

  test "visiting the check page restarts a stale zombie check" do
    owner = make_user
    project = Project.create!(user: owner, name: "Zombie", tier: "tier_4", status: :draft)
    project.update_columns(ai_check_result: { "status" => "running", "started_at" => 20.minutes.ago.iso8601 })
    sign_in_as(owner)

    assert_enqueued_with(job: RunAiRequirementsCheckJob, args: [ project.id ]) do
      get ai_check_project_path(project), headers: { "X-Requested-With" => "XMLHttpRequest" }
    end
    assert_response :success
    assert_equal "queued", project.reload.ai_check_result["status"]
  end

  test "visiting the check page leaves a fresh check alone" do
    owner = make_user
    project = Project.create!(user: owner, name: "Fresh", tier: "tier_4", status: :draft)
    project.update_columns(ai_check_result: { "status" => "running", "started_at" => 1.minute.ago.iso8601 })
    sign_in_as(owner)

    assert_no_enqueued_jobs(only: RunAiRequirementsCheckJob) do
      get ai_check_project_path(project), headers: { "X-Requested-With" => "XMLHttpRequest" }
    end
    assert_equal "running", project.reload.ai_check_result["status"]
  end

  test "polling status restarts a stale zombie check" do
    owner = make_user
    project = Project.create!(user: owner, name: "Zombie", tier: "tier_4", status: :draft)
    project.update_columns(ai_check_result: { "status" => "running", "started_at" => 20.minutes.ago.iso8601 })
    sign_in_as(owner)

    assert_enqueued_with(job: RunAiRequirementsCheckJob, args: [ project.id ]) do
      get ai_check_status_project_path(project), headers: { "Accept" => "application/json" }
    end
    assert_response :success
    assert_equal "queued", project.reload.ai_check_result["status"]
    assert_equal "queued", response.parsed_body.dig("result", "status")
  end

  test "polling status leaves a fresh check alone" do
    owner = make_user
    project = Project.create!(user: owner, name: "Fresh", tier: "tier_4", status: :draft)
    project.update_columns(ai_check_result: { "status" => "running", "started_at" => 1.minute.ago.iso8601 })
    sign_in_as(owner)

    assert_no_enqueued_jobs(only: RunAiRequirementsCheckJob) do
      get ai_check_status_project_path(project), headers: { "Accept" => "application/json" }
    end
    assert_equal "running", project.reload.ai_check_result["status"]
  end
end
