# frozen_string_literal: true

class DevlogPolicy < ApplicationPolicy
  def show?
    ProjectPolicy.new(user, record.project).show?
  end

  # The devlog author edits their own entries; the project owner retains
  # edit access to all entries (matches pre-collaborator behavior).
  def update?
    return false if record.project.discarded? && !admin?
    admin? || author? || project_owner?
  end

  def destroy?
    update?
  end

  private

  def author?
    user.present? && record.user_id == user.id
  end

  def project_owner?
    user.present? && record.project.user_id == user.id
  end
end
