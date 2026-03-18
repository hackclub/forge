class UserPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin? || record == user
  end

  def update?
    admin? || record == user
  end

  def destroy?
    admin? && record != user
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.admin?
        scope.all
      else
        scope.kept.where(id: user&.id)
      end
    end
  end
end
