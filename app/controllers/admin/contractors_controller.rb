class Admin::ContractorsController < Admin::ApplicationController
  include ContractorSerialization

  def index
    authorize ContractorAgreement

    users = contractors.includes(:contractor_agreement).order(:display_name).to_a
    sums = ContractorInvoice.where(user_id: users.map(&:id)).group(:user_id, :status).sum(:total_cents)

    render inertia: "Admin/Contractors/Index", props: {
      contractors: users.map { |user| serialize_contractor_row(user, sums) },
      totals: invoice_totals(ContractorInvoice.all)
    }
  end

  def show
    authorize ContractorAgreement, :index?

    user = contractors.find(params[:id])
    agreement = user.contractor_agreement
    invoices = user.contractor_invoices
    invoices.pending_signature.each(&:refresh!)

    render inertia: "Admin/Contractors/Show", props: {
      contractor: serialize_contractor(user),
      agreement: agreement && serialize_agreement(agreement),
      current_week: agreement && current_week_summary(agreement).except(:line_items),
      invoices: invoices.order(week_start: :desc).map { |invoice| serialize_invoice(invoice) },
      totals: invoice_totals(invoices)
    }
  end

  def mark_all_paid
    authorize ContractorAgreement, :index?

    user = contractors.find(params[:id])
    invoices = user.contractor_invoices.signed.to_a
    ContractorInvoice.transaction { invoices.each { |invoice| invoice.mark_paid!(by: current_user) } }
    audit!("contractor_invoice.bulk_paid", target: user, metadata: { invoice_ids: invoices.map(&:id), total_cents: invoices.sum(&:total_cents) })
    redirect_to admin_contractor_path(user), notice: "Marked #{invoices.size} invoice(s) paid."
  end

  private

  def contractors
    User.where("permissions @> ARRAY[?]::varchar[]", "contractor").or(User.where(id: ContractorAgreement.select(:user_id)))
  end

  def serialize_contractor(user)
    {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar: user.avatar,
      active: user.has_permission?("contractor")
    }
  end

  def serialize_contractor_row(user, sums)
    agreement = user.contractor_agreement
    serialize_contractor(user).merge(
      signed_at: agreement&.signed_at&.iso8601,
      billable_from: agreement && serialize_agreement(agreement)[:billable_from],
      awaiting_signature_cents: sums[[ user.id, "pending_signature" ]].to_i,
      owed_cents: sums[[ user.id, "signed" ]].to_i,
      paid_cents: sums[[ user.id, "paid" ]].to_i
    )
  end
end
