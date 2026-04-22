# == Schema Information
#
# Table name: airtable_queue_items
#
#  id                 :bigint           not null, primary key
#  error              :text
#  payload            :jsonb            not null
#  sent_at            :datetime
#  status             :integer          default("pending"), not null
#  table_name         :string           not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  airtable_record_id :string
#  enqueued_by_id     :bigint
#  forge_id           :string           not null
#  project_id         :bigint
#  sent_by_id         :bigint
#
# Indexes
#
#  index_airtable_queue_items_on_enqueued_by_id  (enqueued_by_id)
#  index_airtable_queue_items_on_project_id      (project_id)
#  index_airtable_queue_items_on_sent_by_id      (sent_by_id)
#  index_airtable_queue_items_on_status          (status)
#
# Foreign Keys
#
#  fk_rails_...  (enqueued_by_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (sent_by_id => users.id)
#
class AirtableQueueItem < ApplicationRecord
  has_paper_trail

  belongs_to :project, optional: true
  belongs_to :enqueued_by, class_name: "User", optional: true
  belongs_to :sent_by, class_name: "User", optional: true

  enum :status, { pending: 0, sent: 1, cancelled: 2, failed: 3 }

  scope :recent, -> { order(created_at: :desc) }

  def self.enqueue_for_project(project, table: AirtableService.default_table)
    where(project_id: project.id, status: :pending).update_all(status: statuses[:cancelled], updated_at: Time.current)
    create!(
      project: project,
      table_name: table,
      forge_id: project.id.to_s,
      payload: AirtableSyncJob.build_fields(project),
      status: :pending
    )
  end

  def send_to_airtable!(actor:)
    return false unless pending?

    response = AirtableService.upsert_by_forge_id(forge_id, payload, table: table_name)
    if response.is_a?(Hash) && response["id"]
      update!(status: :sent, sent_by: actor, sent_at: Time.current, airtable_record_id: response["id"], error: nil)
      true
    else
      update!(status: :failed, sent_by: actor, sent_at: Time.current, error: "Airtable returned no record id")
      false
    end
  rescue StandardError => e
    update!(status: :failed, sent_by: actor, sent_at: Time.current, error: "#{e.class}: #{e.message}")
    false
  end
end
