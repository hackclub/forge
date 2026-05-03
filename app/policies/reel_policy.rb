# frozen_string_literal: true

class ReelPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    return false unless user
    record.project.user_id == user.id
  end

  def update?
    admin? || owner?
  end

  def destroy?
    admin? || owner?
  end

  def manage?
    admin? || owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
