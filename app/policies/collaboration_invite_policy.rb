# frozen_string_literal: true

class CollaborationInvitePolicy < ApplicationPolicy
  def create?
    ProjectPolicy.new(user, record.project).manage_team?
  end

  def revoke?
    create?
  end

  def accept?
    invitee?
  end

  def decline?
    invitee?
  end

  private

  def invitee?
    user.present? && record.invitee_id == user.id
  end
end
