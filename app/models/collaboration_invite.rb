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
class CollaborationInvite < ApplicationRecord
  class NotActionable < StandardError; end

  has_paper_trail

  belongs_to :project
  belongs_to :inviter, class_name: "User"
  belongs_to :invitee, class_name: "User"

  enum :status, { pending: 0, accepted: 1, declined: 2, revoked: 3 }

  validate :invitee_is_not_inviter, on: :create
  validate :invitee_is_not_already_member, on: :create
  validate :no_other_pending_invite, on: :create
  validate :project_is_invitable, on: :create

  # Creates the collaborator row. Raises NotActionable when the invite or
  # project state no longer allows joining, or ActiveRecord::RecordInvalid
  # when the team is full (cap enforced by ProjectCollaborator validations).
  def accept!
    transaction do
      lock!
      raise NotActionable, "This invite is no longer pending." unless pending?
      raise NotActionable, "This project is no longer accepting members." if project.discarded? || !self.class.invitable_status?(project)

      collaborator = project.project_collaborators.create!(user: invitee)
      update!(status: :accepted)
      collaborator
    end
  end

  def decline!
    transaction do
      lock!
      raise NotActionable, "This invite is no longer pending." unless pending?

      update!(status: :declined)
    end
  end

  def revoke!
    transaction do
      lock!
      raise NotActionable, "This invite is no longer pending." unless pending?

      update!(status: :revoked)
    end
  end

  def self.invitable_status?(project)
    !project.approved? && !project.rejected?
  end

  private

  def invitee_is_not_inviter
    errors.add(:invitee, "can't be yourself") if invitee_id == inviter_id
  end

  def invitee_is_not_already_member
    errors.add(:invitee, "is already on this project") if project&.member?(invitee)
  end

  def no_other_pending_invite
    if project && self.class.pending.where(project: project, invitee_id: invitee_id).where.not(id: id).exists?
      errors.add(:invitee, "already has a pending invite to this project")
    end
  end

  def project_is_invitable
    return unless project

    errors.add(:project, "build reviews can't have collaborators") if project.build_review?
    errors.add(:project, "is no longer accepting members") if project.discarded? || !self.class.invitable_status?(project)
  end
end
