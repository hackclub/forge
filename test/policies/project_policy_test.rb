require "test_helper"

class ProjectPolicyTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @owner = users(:one)
    @collaborator = users(:two)
    @stranger = users(:three)
    @project.project_collaborators.create!(user: @collaborator)
  end

  def policy(user, project = @project)
    ProjectPolicy.new(user, project)
  end

  test "collaborators can view, even when hidden" do
    @project.update!(hidden: true)
    assert policy(@collaborator).show?
    assert_not policy(@stranger).show?
  end

  test "collaborators can create devlogs" do
    assert policy(@collaborator).create_devlog?
    assert policy(@owner).create_devlog?
    assert_not policy(@stranger).create_devlog?
    assert_not policy(nil).create_devlog?
  end

  test "collaborators cannot update, submit, or destroy" do
    assert_not policy(@collaborator).update?
    assert_not policy(@collaborator).submit_for_review?
    assert_not policy(@collaborator).destroy?
  end

  test "only the owner manages the team" do
    assert policy(@owner).manage_team?
    assert_not policy(@collaborator).manage_team?
    assert_not policy(@stranger).manage_team?
  end

  test "build review owners cannot manage a team" do
    approved = Project.create!(user: @owner, name: "Base", tier: "tier_4", status: :approved)
    build_review = Project.create!(
      user: @owner, name: "BR", tier: Project::BUILD_REVIEW_TIER,
      build_review: true, linked_project: approved
    )
    assert_not policy(@owner, build_review).manage_team?
  end
end
