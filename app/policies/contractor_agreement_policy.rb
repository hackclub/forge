class ContractorAgreementPolicy < ApplicationPolicy
  def index?
    superadmin?
  end

  def show?
    superadmin? || (owner? && contractor?)
  end

  def create?
    contractor? && user.contractor_agreement.nil?
  end

  def update?
    superadmin?
  end

  private

  def superadmin?
    user&.superadmin?
  end

  def contractor?
    user&.has_permission?("contractor")
  end
end
