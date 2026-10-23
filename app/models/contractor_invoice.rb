# == Schema Information
#
# Table name: contractor_invoices
#
#  id                      :bigint           not null, primary key
#  line_items              :jsonb            not null
#  paid_at                 :datetime
#  review_count            :integer          default(0), not null
#  signed_at               :datetime
#  signed_ip               :string
#  signed_name             :string
#  status                  :integer          default("pending_signature"), not null
#  total_cents             :integer          default(0), not null
#  week_start              :date             not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  contractor_agreement_id :bigint           not null
#  paid_by_id              :bigint
#  user_id                 :bigint           not null
#
# Indexes
#
#  index_contractor_invoices_on_contractor_agreement_id  (contractor_agreement_id)
#  index_contractor_invoices_on_paid_by_id               (paid_by_id)
#  index_contractor_invoices_on_status                   (status)
#  index_contractor_invoices_on_user_id                  (user_id)
#  index_contractor_invoices_on_user_id_and_week_start   (user_id,week_start) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (contractor_agreement_id => contractor_agreements.id)
#  fk_rails_...  (paid_by_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class ContractorInvoice < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :contractor_agreement
  belongs_to :paid_by, class_name: "User", optional: true

  enum :status, { pending_signature: 0, signed: 1, paid: 2 }

  validates :week_start, presence: true, uniqueness: { scope: :user_id }

  def week_range
    ContractorBilling.week_range(week_start)
  end

  def refresh!
    return unless pending_signature?

    update!(ContractorBilling.new(contractor_agreement).summary(week_range))
  end

  def sign!(name:, ip:)
    update!(status: :signed, signed_name: name, signed_ip: ip, signed_at: Time.current)
  end

  def mark_paid!(by:)
    update!(status: :paid, paid_at: Time.current, paid_by: by)
  end
end
