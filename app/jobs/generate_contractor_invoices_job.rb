class GenerateContractorInvoicesJob < ApplicationJob
  queue_as :background

  def perform(agreement_id = nil)
    agreements = ContractorAgreement.includes(:user).joins(:user).where("users.permissions @> ARRAY[?]::varchar[]", "contractor")
    agreements = agreements.where(id: agreement_id) if agreement_id

    agreements.find_each do |agreement|
      ContractorBilling.new(agreement).generate_invoices!
    end
  end
end
