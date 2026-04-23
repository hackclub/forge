# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def show?
    return false if record.discarded? && !admin?
    return true if owner? || user&.staff?
    return false if record.hidden?

    true
  end

  def create?
    user.present?
  end

  def import_from_github?
    user.present?
  end

  def update?
    return false if record.discarded? && !admin?
    admin? || owner?
  end

  def destroy?
    return admin? if record.discarded?
    admin? || owner?
  end

  def submit_for_review?
    return false unless owner?
    record.reviewable?
  end

  def restore?
    admin? && record.discarded?
  end

  def review?
    user&.has_permission?("projects")
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.has_permission?("projects")
        scope.all
      else
        scope.kept
      end
    end
  end
end
