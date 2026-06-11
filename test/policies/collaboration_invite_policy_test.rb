require "test_helper"

class CollaborationInvitePolicyTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @owner = users(:one)
    @invitee = users(:two)
    @stranger = users(:three)
    @invite = @project.collaboration_invites.create!(inviter: @owner, invitee: @invitee)
  end

  def policy(user)
    CollaborationInvitePolicy.new(user, @invite)
  end

  test "only the owner can create and revoke invites" do
    assert policy(@owner).create?
    assert policy(@owner).revoke?
    assert_not policy(@invitee).create?
    assert_not policy(@stranger).revoke?
  end

  test "only the invitee can accept or decline" do
    assert policy(@invitee).accept?
    assert policy(@invitee).decline?
    assert_not policy(@owner).accept?
    assert_not policy(@stranger).decline?
  end
end
