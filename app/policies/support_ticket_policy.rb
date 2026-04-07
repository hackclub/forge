class SupportTicketPolicy < ApplicationPolicy
  def index?
    user&.has_permission?("support")
  end

  def show?
    user&.has_permission?("support")
  end

  def reply?
    user&.has_permission?("support")
  end

  def claim?
    user&.has_permission?("support")
  end

  def resolve?
    user&.has_permission?("support")
  end

  def destroy?
    admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
