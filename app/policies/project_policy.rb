# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def show?
    return false if record.discarded? && !admin?
    return true if member? || user&.staff?
    return false if record.hidden?

    true
  end

  def create?
    user.present?
  end

  def import_from_github?
    user.present?
  end

  def import_from_macondo?
    user.present?
  end

  def hackatime_projects?
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
    user&.has_permission?("projects") && user.has_permission?("review_#{record.review_tier}")
  end

  def requirements_check?
    user.present? && user.has_permission?("review_requirements")
  end

  def review_screen?
    review? || requirements_check?
  end

  def create_devlog?
    return false if record.discarded?
    admin? || member?
  end

  def manage_team?
    return false if record.discarded?
    owner? && !record.build_review?
  end

  private

  def collaborator?
    user.present? && record.project_collaborators.exists?(user_id: user.id)
  end

  def member?
    owner? || collaborator?
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
