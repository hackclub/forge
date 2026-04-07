class SupportTicketPolicy < ApplicationPolicy
  def index?
    user&.has_permission?("support")
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
