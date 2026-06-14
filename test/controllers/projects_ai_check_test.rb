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
end
