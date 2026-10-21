class Admin::ContractorAgreementsController < Admin::ApplicationController
  include ContractorSerialization

  before_action :set_agreement

  def show
    authorize @agreement

    render inertia: "Admin/ContractorAgreements/Show", props: {
      agreement: serialize_agreement(@agreement)
    }
  end

  def update
    authorize @agreement

    billable_from = Date.iso8601(params[:billable_from].to_s) rescue nil
    unless billable_from
      redirect_to admin_contractor_path(@agreement.user_id), alert: "Pick a valid billable-from date."
      return
    end

    @agreement.assign_attributes(
      billable_from: ContractorBilling.zone.local(billable_from.year, billable_from.month, billable_from.day),
      approve_rate_cents: dollars_to_cents(params[:approve_rate]),
      return_rate_cents: dollars_to_cents(params[:return_rate]),
      reject_rate_cents: dollars_to_cents(params[:reject_rate])
    )

    unless @agreement.save
      redirect_to admin_contractor_path(@agreement.user_id), alert: @agreement.errors.full_messages.to_sentence
      return
    end

    audit!("contractor_agreement.updated", target: @agreement, metadata: audit_changes_for(@agreement))
    GenerateContractorInvoicesJob.perform_later(@agreement.id)
    redirect_to admin_contractor_path(@agreement.user_id), notice: "Contract updated. Unsigned invoices will be recalculated."
  end

  private

  def set_agreement
    @agreement = ContractorAgreement.find(params[:id])
  end

  def dollars_to_cents(value)
    (BigDecimal(value.to_s) * 100).round
  rescue ArgumentError
    nil
  end
end
