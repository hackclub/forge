class ContractorInvoicePolicy < ApplicationPolicy
  def show?
    superadmin? || (owner? && contractor?)
  end

  def sign?
    owner? && contractor? && record.pending_signature?
  end

  def mark_paid?
    superadmin? && record.signed?
  end

  private

  def superadmin?
    user&.superadmin?
  end

  def contractor?
    user&.has_permission?("contractor")
  end
end
