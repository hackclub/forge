require "test_helper"

class Admin::ReviewsRequirementsClaimTest < ActionDispatch::IntegrationTest
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

  setup do
    @checker = make_user(roles: %w[user reviewer], permissions: %w[review_requirements], birthday: Date.new(2008, 1, 1))
    @project = Project.create!(
      user: make_user,
      name: "Needs A Requirements Check",
      tier: "tier_2",
      status: :pending,
      submitted_at: 1.hour.ago
    )
  end

  test "requirements checker opening a review does not claim it" do
    sign_in_as(@checker)

    assert_no_difference "ReviewSession.count" do
      get admin_review_path(@project)
    end
    assert_response :success
  end

  test "a tier reviewer opening a review still claims it" do
    reviewer = make_user(roles: %w[user reviewer], permissions: User::ROLE_DEFAULT_PERMISSIONS["reviewer"], birthday: Date.new(2008, 1, 1))
    sign_in_as(reviewer)

    assert_difference "ReviewSession.count", 1 do
      get admin_review_path(@project)
    end
    assert_response :success
  end

  test "requirements checker can still act while a reviewer holds the claim" do
    reviewer = make_user(roles: %w[user reviewer], permissions: User::ROLE_DEFAULT_PERMISSIONS["reviewer"], birthday: Date.new(2008, 1, 1))
    ReviewSession.create!(project: @project, reviewer: reviewer, started_at: Time.current, last_heartbeat_at: Time.current)

    sign_in_as(@checker)
    get admin_review_path(@project)

    assert_equal true, inertia.props[:can][:claim]
    assert_equal false, inertia.props[:claim][:can_take_over]
  end

  test "requirements checker cannot take over a claim" do
    reviewer = make_user(roles: %w[user reviewer], permissions: User::ROLE_DEFAULT_PERMISSIONS["reviewer"], birthday: Date.new(2008, 1, 1))
    ReviewSession.create!(project: @project, reviewer: reviewer, started_at: Time.current, last_heartbeat_at: Time.current)

    sign_in_as(@checker)
    post admin_claim_review_path(@project)

    assert_redirected_to root_path
    assert ReviewSession.active.for_project(@project).exists?(reviewer_id: reviewer.id)
  end
end
