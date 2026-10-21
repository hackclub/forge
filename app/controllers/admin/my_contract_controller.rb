class Admin::MyContractController < Admin::ApplicationController
  include ContractorSerialization

  before_action :require_contractor_permission!

  def show
    agreement = current_user.contractor_agreement

    if agreement.nil?
      render inertia: "Admin/MyContract/Sign", props: {
        signer: { display_name: current_user.display_name, email: current_user.email },
        rates: ContractorAgreement.new.rates
      }
      return
    end

    invoices = agreement.contractor_invoices
    invoices.pending_signature.each(&:refresh!)

    render inertia: "Admin/MyContract/Show", props: {
      agreement: serialize_agreement(agreement),
      current_week: current_week_summary(agreement).except(:line_items),
      invoices: invoices.order(week_start: :desc).map { |invoice| serialize_invoice(invoice) },
      totals: invoice_totals(invoices)
    }
  end

  def sign
    authorize ContractorAgreement, :create?

    signed_name = params[:signed_name].to_s.strip
    unless signed_name.present? && ActiveModel::Type::Boolean.new.cast(params[:agree])
      redirect_to admin_my_contract_path, alert: "Type your full legal name and accept the agreement to sign."
      return
    end

    now = Time.current
    agreement = current_user.create_contractor_agreement!(
      contract_version: ContractorAgreement::CURRENT_VERSION,
      signed_name: signed_name,
      signed_email: current_user.email,
      signed_ip: request.remote_ip,
      signed_at: now,
      billable_from: now
    )
    audit!("contractor_agreement.signed", target: agreement, metadata: { contract_version: agreement.contract_version })
    redirect_to admin_my_contract_path, notice: "Contract signed."
  end

  private

  def require_contractor_permission!
    require_permission!("contractor")
  end
end
