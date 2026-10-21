module ContractorSerialization
  extend ActiveSupport::Concern

  private

  def serialize_agreement(agreement)
    {
      id: agreement.id,
      contract_version: agreement.contract_version,
      signed_name: agreement.signed_name,
      signed_email: agreement.signed_email,
      signed_at: agreement.signed_at.iso8601,
      billable_from: agreement.billable_from.in_time_zone(ContractorBilling.zone).to_date.iso8601,
      rates: agreement.rates
    }
  end

  def serialize_invoice(invoice, line_items: false)
    data = {
      id: invoice.id,
      week_start: invoice.week_start.iso8601,
      week_end: (invoice.week_start + 6.days).iso8601,
      status: invoice.status,
      review_count: invoice.review_count,
      total_cents: invoice.total_cents,
      signed_name: invoice.signed_name,
      signed_at: invoice.signed_at&.iso8601,
      paid_at: invoice.paid_at&.iso8601
    }
    data[:line_items] = invoice.line_items if line_items
    data
  end

  def current_week_summary(agreement)
    week_start = ContractorBilling.current_week_start
    ContractorBilling.new(agreement).summary(ContractorBilling.week_range(week_start)).merge(
      week_start: week_start.iso8601,
      week_end: (week_start + 6.days).iso8601
    )
  end

  def invoice_totals(invoices)
    sums = invoices.group(:status).sum(:total_cents)
    {
      awaiting_signature_cents: sums["pending_signature"].to_i,
      owed_cents: sums["signed"].to_i,
      paid_cents: sums["paid"].to_i
    }
  end
end
