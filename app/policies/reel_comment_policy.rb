# frozen_string_literal: true

class ReelCommentPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def create?
    user.present?
  end

  def destroy?
    return false unless user
    admin? || record.user_id == user.id || record.reel.user_id == user.id
  end
end
