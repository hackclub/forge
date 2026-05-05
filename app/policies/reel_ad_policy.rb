# frozen_string_literal: true

class ReelAdPolicy < ApplicationPolicy
  def index?
    user&.has_permission?("reel_ads")
  end

  def create?
    index?
  end

  def update?
    index?
  end

  def destroy?
    index?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
