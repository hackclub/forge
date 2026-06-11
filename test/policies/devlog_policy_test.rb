require "test_helper"

class DevlogPolicyTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @owner = users(:one)
    @collaborator = users(:two)
    @other_collaborator = users(:three)
    @project.project_collaborators.create!(user: @collaborator)
    @project.project_collaborators.create!(user: @other_collaborator)
    @devlog = @project.devlogs.create!(user: @collaborator, title: "Entry", content: "Did things")
  end

  def policy(user)
    DevlogPolicy.new(user, @devlog)
  end

  test "the author can edit their own devlog" do
    assert policy(@collaborator).update?
    assert policy(@collaborator).destroy?
  end

  test "the project owner can edit any devlog" do
    assert policy(@owner).update?
  end

  test "other collaborators cannot edit someone else's devlog" do
    assert_not policy(@other_collaborator).update?
    assert_not policy(@other_collaborator).destroy?
  end

  test "signed-out users cannot edit" do
    assert_not policy(nil).update?
  end
end
