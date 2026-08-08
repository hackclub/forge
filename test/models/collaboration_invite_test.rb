# == Schema Information
#
# Table name: collaboration_invites
#
#  id         :bigint           not null, primary key
#  status     :integer          default("pending"), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  invitee_id :bigint           not null
#  inviter_id :bigint           not null
#  project_id :bigint           not null
#
# Indexes
#
#  index_collaboration_invites_on_invitee_id               (invitee_id)
#  index_collaboration_invites_on_inviter_id               (inviter_id)
#  index_collaboration_invites_on_project_id               (project_id)
#  index_collaboration_invites_on_project_invitee_pending  (project_id,invitee_id) UNIQUE WHERE (status = 0)
#  index_collaboration_invites_on_status                   (status)
#
# Foreign Keys
#
#  fk_rails_...  (invitee_id => users.id)
#  fk_rails_...  (inviter_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#
require "test_helper"

class CollaborationInviteTest < ActiveSupport::TestCase
  setup do
    @project = projects(:one)
    @owner = users(:one)
    @invitee = users(:two)
  end

  def build_invite(invitee: @invitee)
    @project.collaboration_invites.build(inviter: @owner, invitee: invitee)
  end

  test "creates a pending invite" do
    invite = build_invite
    assert invite.save
    assert invite.pending?
  end

  test "rejects inviting yourself" do
    invite = build_invite(invitee: @owner)
    assert_not invite.valid?
  end

  test "rejects inviting an existing member" do
    @project.project_collaborators.create!(user: @invitee)
    invite = build_invite
    assert_not invite.valid?
  end

  test "rejects a second pending invite for the same user" do
    build_invite.save!
    dup = build_invite
    assert_not dup.valid?
  end

  test "allows re-inviting after a decline" do
    invite = build_invite.tap(&:save!)
    invite.decline!
    assert build_invite.save
  end

  test "rejects invites on approved projects" do
    @project.update!(status: :approved)
    invite = build_invite
    assert_not invite.valid?
  end

  test "accept! creates the collaborator and marks the invite accepted" do
    invite = build_invite.tap(&:save!)
    invite.accept!
    assert invite.reload.accepted?
    assert @project.member?(@invitee)
  end

  test "accept! refuses once the project is approved" do
    invite = build_invite.tap(&:save!)
    @project.update!(status: :approved)
    assert_raises(CollaborationInvite::NotActionable) { invite.accept! }
    assert invite.reload.pending?
    assert_not @project.member?(@invitee)
  end

  test "accept! refuses when the team is full" do
    invite = build_invite.tap(&:save!)
    [ users(:three), users(:four), users(:five), users(:six) ].each do |user|
      @project.project_collaborators.create!(user: user)
    end
    assert_raises(ActiveRecord::RecordInvalid) { invite.accept! }
    assert_not @project.member?(@invitee)
  end

  test "decline! and revoke! only work on pending invites" do
    invite = build_invite.tap(&:save!)
    invite.accept!
    assert_raises(CollaborationInvite::NotActionable) { invite.decline! }
    assert_raises(CollaborationInvite::NotActionable) { invite.revoke! }
  end
end
