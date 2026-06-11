require "test_helper"

class ProjectCollaboratorTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @owner = users(:one)
  end

  test "adds a collaborator" do
    collaborator = @project.project_collaborators.create!(user: users(:two))
    assert @project.member?(users(:two))
    assert_includes @project.members, users(:two)
    assert_equal users(:two), collaborator.user
  end

  test "rejects the project owner as collaborator" do
    record = @project.project_collaborators.build(user: @owner)
    assert_not record.valid?
    assert_match(/already owns/, record.errors.full_messages.join)
  end

  test "rejects duplicate collaborators" do
    @project.project_collaborators.create!(user: users(:two))
    dup = @project.project_collaborators.build(user: users(:two))
    assert_not dup.valid?
  end

  test "rejects collaborators on build review projects" do
    approved = Project.create!(user: @owner, name: "Base", tier: "tier_4", status: :approved)
    build_review = Project.create!(
      user: @owner, name: "Build Review", tier: Project::BUILD_REVIEW_TIER,
      build_review: true, linked_project: approved
    )
    record = build_review.project_collaborators.build(user: users(:two))
    assert_not record.valid?
    assert_match(/build reviews/, record.errors.full_messages.join)
  end

  test "enforces the team size cap" do
    [ users(:two), users(:three), users(:four), users(:five) ].each do |user|
      @project.project_collaborators.create!(user: user)
    end
    overflow = @project.project_collaborators.build(user: users(:six))
    assert_not overflow.valid?
    assert_match(/team is full/, overflow.errors.full_messages.join)
  end
end
