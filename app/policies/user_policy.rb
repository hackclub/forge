class UserPolicy < ApplicationPolicy
  def index?
    has_users_permission?
  end

  def show?
    has_users_permission? || record == user
  end

  def update?
    admin? || record == user
  end

  def destroy?
    admin? && record != user
  end

  def restore?
    admin? && record.discarded?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.has_permission?("users")
        scope.all
      else
        scope.kept.where(id: user&.id)
      end
    end
  end

  private

  def has_users_permission?
    user&.has_permission?("users")
  end
end
