class Admin::ContractorInvoicesController < Admin::ApplicationController
  include ContractorSerialization

  before_action :set_invoice

  def show
    authorize @invoice
    @invoice.refresh!

    render inertia: "Admin/ContractorInvoices/Show", props: {
      invoice: serialize_invoice(@invoice, line_items: true),
      contractor: { id: @invoice.user_id, display_name: @invoice.user.display_name, email: @invoice.user.email },
      agreement: serialize_agreement(@invoice.contractor_agreement),
      can_sign: policy(@invoice).sign?,
      can_mark_paid: policy(@invoice).mark_paid?
    }
  end

  def sign
    authorize @invoice

    signed_name = params[:signed_name].to_s.strip
    unless signed_name.present? && ActiveModel::Type::Boolean.new.cast(params[:agree])
      redirect_to admin_contractor_invoice_path(@invoice), alert: "Type your full legal name and confirm the invoice to sign."
      return
    end

    signed = @invoice.with_lock do
      @invoice.refresh!
      next false unless @invoice.pending_signature? && @invoice.total_cents == params[:total_cents].to_i

      @invoice.sign!(name: signed_name, ip: request.remote_ip)
    end

    unless signed
      redirect_to admin_contractor_invoice_path(@invoice), alert: "This invoice changed since you opened it. Check it again before signing."
      return
    end

    audit!("contractor_invoice.signed", target: @invoice, metadata: { week_start: @invoice.week_start.iso8601, total_cents: @invoice.total_cents })
    redirect_to admin_contractor_invoice_path(@invoice), notice: "Invoice signed."
  end

  def mark_paid
    authorize @invoice

    @invoice.with_lock { @invoice.mark_paid!(by: current_user) if @invoice.signed? }
    audit!("contractor_invoice.paid", target: @invoice, metadata: { week_start: @invoice.week_start.iso8601, total_cents: @invoice.total_cents })
    redirect_back fallback_location: admin_contractor_invoice_path(@invoice), notice: "Invoice marked paid."
  end

  def destroy
    authorize @invoice

    @invoice.destroy!
    audit!("contractor_invoice.deleted", target: @invoice.user, metadata: { invoice_id: @invoice.id, week_start: @invoice.week_start.iso8601, status: @invoice.status, total_cents: @invoice.total_cents })
    redirect_to admin_contractor_path(@invoice.user), notice: "Invoice deleted."
  end

  private

  def set_invoice
    @invoice = ContractorInvoice.includes(:user, :contractor_agreement).find(params[:id])
  end
end
