require "test_helper"

# The approve path has to refuse the things Forge has been fined for, even when
# the request bypasses the UI entirely.
class Admin::ReviewsFineGuardTest < ActionDispatch::IntegrationTest
  GOOD_ASSESSMENT = <<~TEXT.strip
    9 journal entries between Feb 3 and Feb 17 totalling 12.4h, each with photos of the board
    at that stage. The commit log covers the same span across 34 commits. Pace averages
    0.7h/day with no single session over 2h.
  TEXT
  GOOD_TECHNICAL = "custom ESP32 PCB with USB-C charging, CAD case in Fusion, PID motor firmware"

  def make_user(attrs = {})
    token = SecureRandom.hex(6)
    User.create!({
      avatar: "avatar", display_name: "User #{token}", email: "#{token}@example.com",
      timezone: "UTC", slack_id: "S#{token}", hca_id: "H#{token}", roles: [ "user" ]
    }.merge(attrs))
  end

  # AuthController rate-limits sign-in to 10 per 3 minutes, keyed by controller
  # and remote IP. This file signs in once per test, so past the tenth test the
  # callback 429s and the test runs unauthenticated — which surfaces as an
  # unrelated 302 much later. A distinct IP per sign-in keeps each test on its
  # own counter.
  def sign_in_as(user)
    original = User.method(:exchange_hca_token)
    User.define_singleton_method(:exchange_hca_token) { |*_| user }
    get hca_callback_path, params: { code: "x" }, headers: { "REMOTE_ADDR" => unique_ip }
    assert_equal 302, response.status, "sign-in failed (#{response.status}) — rate limited?"
  ensure
    User.define_singleton_method(:exchange_hca_token, original)
  end

  def unique_ip
    @@ip_counter = (defined?(@@ip_counter) ? @@ip_counter : 0) + 1
    "10.#{(@@ip_counter / 65_536) % 256}.#{(@@ip_counter / 256) % 256}.#{@@ip_counter % 256}"
  end

  setup do
    Rails.cache.clear
    @reviewer = make_user(
      roles: %w[user reviewer],
      permissions: %w[projects pending_reviews review_tier_2],
      birthday: Date.new(2008, 1, 1)
    )
    @builder = make_user
    @project = Project.create!(
      user: @builder, name: "Macropad", tier: "tier_2", status: :pending,
      repo_link: "https://github.com/builder/macropad", devlog_mode: "git",
      submitted_at: 1.hour.ago
    )
    @project.devlogs.create!(
      user: @builder, title: "Wired the matrix", content: "x" * 300,
      time_hours: 12.4, entry_date: Date.new(2026, 2, 3)
    )
    sign_in_as(@reviewer)
  end

  def approve(**overrides)
    post review_admin_project_path(@project), params: {
      decision: "approve",
      checklist: ReviewChecklist.keys_for(@project),
      reasoning: GOOD_ASSESSMENT,
      technical_features: GOOD_TECHNICAL,
      evidence: "https://forge.hackclub.com/projects/#{@project.id}"
    }.merge(overrides)
  end

  test "a specific justification approves" do
    approve
    assert_equal "approved", @project.reload.status
  end

  test "refuses the justification Forge was fined for" do
    approve(reasoning: "the time is justified and checks out")
    assert_equal "pending", @project.reload.status
    assert_match(/fined/i, flash[:alert])
  end

  test "refuses a justification with nothing checkable in it" do
    approve(reasoning: "lgtm")
    assert_equal "pending", @project.reload.status
  end

  test "refuses deflation with no real reason" do
    approve(override_hours: "6.0", override_hours_justification: "too much")
    assert_equal "pending", @project.reload.status
  end

  test "accepts deflation with a substantive reason" do
    approve(
      override_hours: "6.0",
      override_hours_justification: "Entry 3 describes writing up earlier work rather than building, so 6.4h was removed."
    )
    assert_equal "approved", @project.reload.status
    assert_equal 6.0, @project.reload.override_hours.to_f
  end

  test "refuses to let a reviewer approve their own project" do
    @project.update_columns(user_id: @reviewer.id)
    approve
    assert_equal "pending", @project.reload.status
    assert_match(/your own project/i, flash[:alert])
  end

  test "refuses a duplicate repo until the reviewer explains it" do
    Project.create!(
      user: make_user, name: "Earlier Macropad", tier: "tier_2", status: :approved,
      repo_link: @project.repo_link
    )
    Rails.cache.clear

    approve
    assert_equal "pending", @project.reload.status
    assert_match(/double-dipping/i, flash[:alert])
  end

  test "approves a duplicate once the reviewer explains it, and records the reason" do
    Project.create!(
      user: make_user, name: "Earlier Macropad", tier: "tier_2", status: :approved,
      repo_link: @project.repo_link
    )
    Rails.cache.clear

    reason = "The earlier record covered the PCB only; these hours are the enclosure work committed after Mar 12."
    approve(duplicate_acknowledgement: reason)

    assert_equal "approved", @project.reload.status
    assert_includes @project.reload.approval_justification, reason
  end

  # serialize_project_for_review now runs the duplicate scan, the journal digest
  # and the examples builder. Any of them raising would 500 the review page.
  test "the review page renders with the new panels" do
    get admin_review_path(@project)
    assert_response :success
  end

  # The Pitch and Description tabs are hidden client-side for anything below
  # tier 1, which only works if the effective review tier reaches the page.
  test "the review payload carries the effective review tier" do
    get admin_review_path(@project)

    assert_response :success
    assert_equal "tier_2", inertia.props[:project][:review_tier]
  end

  test "a build review reports its linked design project's tier, not its own" do
    # The build review is judged at the design project's tier, so the reviewer
    # needs that tier's permission to open it at all.
    @reviewer.update!(permissions: @reviewer.permissions + [ "review_tier_1" ])
    @project.update!(status: :approved, tier: "tier_1", reviewer: @reviewer, reviewed_at: Time.current)
    build = Project.create!(
      user: @builder, name: "Macropad build", tier: "tier_build_review", status: :pending,
      build_review: true, linked_project: @project, submitted_at: 1.hour.ago
    )

    get admin_review_path(build)

    assert_response :success
    # A build review's own tier is a sentinel, so gating the tabs on `tier`
    # would have hidden them on every build review, tier 1 included.
    assert_equal "tier_build_review", inertia.props[:project][:tier]
    assert_equal "tier_1", inertia.props[:project][:review_tier]
  end

  test "the review page renders for a project with a long journal and no repo" do
    @project.update_columns(repo_link: nil)
    30.times do |i|
      @project.devlogs.create!(
        user: @builder, title: "Day #{i}", content: "x" * 200,
        time_hours: 1.0, entry_date: Date.new(2026, 1, 5) + i
      )
    end

    get admin_review_path(@project)
    assert_response :success
  end

  # --- per-entry journal deflation ----------------------------------------
  #
  # Hours are approved per journal entry now, so the aggregate reason string is
  # composed for the reviewer. That defeats the text linter's length check on
  # it, and these guards are what actually hold the line.

  def deflations(rows)
    { journal_deflations: JSON.generate(rows) }
  end

  test "approves when every entry is approved in full" do
    entry = @project.devlogs.first
    approve(**deflations([ { devlog_id: entry.id, approved_hours: 12.4, reason: "" } ]))
    assert_equal "approved", @project.reload.status
  end

  test "refuses a deflated entry with no reason" do
    entry = @project.devlogs.first
    approve(
      override_hours: "6.0",
      override_hours_justification: "Entry describes writing up earlier work rather than building.",
      **deflations([ { devlog_id: entry.id, approved_hours: 6.0, reason: "" } ])
    )

    assert_equal "pending", @project.reload.status
    assert_match(/needs a reason/i, flash[:alert])
  end

  test "refuses a deflated entry whose reason is too thin to be a reason" do
    entry = @project.devlogs.first
    approve(
      override_hours: "6.0",
      override_hours_justification: "Entry describes writing up earlier work rather than building.",
      **deflations([ { devlog_id: entry.id, approved_hours: 6.0, reason: "nah" } ])
    )
    assert_equal "pending", @project.reload.status
  end

  test "approves a deflated entry that carries a real reason" do
    entry = @project.devlogs.first
    approve(
      override_hours: "6.0",
      override_hours_justification: "Entry describes writing up earlier work rather than building.",
      **deflations([ {
        devlog_id: entry.id, approved_hours: 6.0,
        reason: "Entry describes writing up earlier work rather than building."
      } ])
    )

    assert_equal "approved", @project.reload.status
    assert_equal 6.0, @project.reload.override_hours.to_f
  end

  # If the two ever disagree we submit a number the justification does not
  # explain, which is exactly what got another program fined.
  test "refuses a submitted total that disagrees with the per-entry approvals" do
    entry = @project.devlogs.first
    approve(
      override_hours: "10.0",
      override_hours_justification: "Deflated for the AI-authored firmware, which was a single prompt.",
      **deflations([ {
        devlog_id: entry.id, approved_hours: 6.0,
        reason: "Entry describes writing up earlier work rather than building."
      } ])
    )

    assert_equal "pending", @project.reload.status
    assert_match(/do not match/i, flash[:alert])
  end

  # Entries that are not on this project are skipped rather than trusted, which
  # then leaves the totals short — so the drift check catches it and tells the
  # reviewer to reload rather than silently submitting the wrong number.
  test "a payload that does not account for the project's hours is refused" do
    approve(**deflations([ { devlog_id: 999_999, approved_hours: 0.0, reason: "" } ]))

    assert_equal "pending", @project.reload.status
    assert_match(/do not match|reload/i, flash[:alert])
  end

  test "a foreign entry alongside the real ones is skipped without breaking approval" do
    entry = @project.devlogs.first
    approve(**deflations([
      { devlog_id: entry.id, approved_hours: 12.4, reason: "" },
      { devlog_id: 999_999, approved_hours: 99.0, reason: "" }
    ]))

    assert_equal "approved", @project.reload.status
    assert_nil @project.reload.override_hours
  end

  test "a malformed deflation payload does not block the approval path" do
    approve(journal_deflations: "not json")
    assert_equal "approved", @project.reload.status
  end

  # --- justification audit endpoint ---------------------------------------
  #
  # A fetch() follows redirects, so answering a JSON request with Pundit's HTML
  # redirect made every permission failure look like a generic network error.

  test "the audit endpoint reports a permission problem as JSON, not a redirect" do
    @reviewer.update!(permissions: %w[projects pending_reviews])

    post check_draft_justification_admin_project_path(@project), params: { justification: "text", approved_hours: 12.4 }

    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_equal "error", body.dig("result", "overall")
    assert_match(/review permission/i, body.dig("result", "message"))
  end

  test "a requirements checker gets a readable message, not a bare 404" do
    checker = make_user(roles: %w[user reviewer], permissions: %w[review_requirements], birthday: Date.new(2008, 1, 1))
    sign_in_as(checker)

    post check_draft_justification_admin_project_path(@project), params: { justification: "text", approved_hours: 12.4 }

    assert_response :forbidden
    assert_match(/review permission/i, JSON.parse(response.body).dig("result", "message"))
  end

  test "the audit endpoint reports a missing AI credential as JSON" do
    post check_draft_justification_admin_project_path(@project), params: { justification: "text", approved_hours: 12.4 }

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "error", body.dig("result", "overall")
    assert_match(/credential|configured/i, body.dig("result", "message"))
  end

  # The per-entry reasons used to be joined with a space, producing one
  # unreadable run-on line in the Unified DB record.
  test "deflation reasons render as a list, one entry per line" do
    entry = @project.devlogs.first
    approve(
      override_hours: "6.0",
      override_hours_justification: %(- "#{entry.title}" 12.4h → 6.0h — Entry describes writing up earlier work.),
      **deflations([ {
        devlog_id: entry.id, approved_hours: 6.0,
        reason: "Entry describes writing up earlier work."
      } ])
    )

    assert_equal "approved", @project.reload.status
    justification = @project.approval_justification
    assert_match(/hours of deflation was applied to meet our requirements:\n- "/, justification)
    refute_match(/requirements — reason:/, justification)
  end

  test "still enforces the checklist" do
    approve(checklist: [])
    assert_equal "pending", @project.reload.status
    assert_match(/checklist/i, flash[:alert])
  end
end
