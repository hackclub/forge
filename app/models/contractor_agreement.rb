# == Schema Information
#
# Table name: contractor_agreements
#
#  id                 :bigint           not null, primary key
#  approve_rate_cents :integer          default(125), not null
#  billable_from      :datetime         not null
#  contract_version   :string           not null
#  reject_rate_cents  :integer          default(75), not null
#  return_rate_cents  :integer          default(75), not null
#  signed_at          :datetime         not null
#  signed_email       :string
#  signed_ip          :string
#  signed_name        :string           not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  user_id            :bigint           not null
#
# Indexes
#
#  index_contractor_agreements_on_user_id  (user_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class ContractorAgreement < ApplicationRecord
  has_paper_trail

  CURRENT_VERSION = "2026-10".freeze

  belongs_to :user
  has_many :contractor_invoices, dependent: :destroy

  validates :contract_version, :signed_name, :signed_at, :billable_from, presence: true
  validates :user_id, uniqueness: true
  validates :approve_rate_cents, :return_rate_cents, :reject_rate_cents,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def rate_cents_for(decision)
    { "approved" => approve_rate_cents, "returned" => return_rate_cents, "rejected" => reject_rate_cents }.fetch(decision)
  end

  def rates
    { approve: approve_rate_cents, return: return_rate_cents, reject: reject_rate_cents }
  end
end
