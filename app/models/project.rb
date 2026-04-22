# == Schema Information
#
# Table name: projects
#
#  id                           :bigint           not null, primary key
#  budget                       :text
#  build_proof_url              :string
#  built_at                     :datetime
#  cover_image_url              :string
#  description                  :text
#  devlog_mode                  :string
#  discarded_at                 :datetime
#  green_flags                  :string           default([]), is an Array
#  hidden                       :boolean          default(FALSE), not null
#  name                         :string           not null
#  override_hours               :decimal(, )
#  override_hours_justification :text
#  pitch_text                   :text
#  readme_cache                 :text
#  readme_fetched_at            :datetime
#  red_flags                    :string           default([]), is an Array
#  repo_link                    :string
#  review_feedback              :text
#  reviewed_at                  :datetime
#  slack_message_ts             :string
#  staff_pick_at                :datetime
#  status                       :integer          default("draft"), not null
#  subtitle                     :string
#  tags                         :string           default([]), not null, is an Array
#  tier                         :string           default("tier_4"), not null
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  reviewer_id                  :bigint
#  slack_channel_id             :string
#  user_id                      :bigint           not null
#
# Indexes
#
#  index_projects_on_discarded_at   (discarded_at)
#  index_projects_on_staff_pick_at  (staff_pick_at)
#  index_projects_on_status         (status)
#  index_projects_on_tags           (tags) USING gin
#  index_projects_on_user_id        (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (reviewer_id => users.id)
#  fk_rails_...  (user_id => users.id)
#
class Project < ApplicationRecord
  include Discardable
  include PgSearch::Model

  has_paper_trail

  pg_search_scope :search, against: [ :name, :description ], using: { tsearch: { prefix: true } }

  belongs_to :user
  belongs_to :reviewer, class_name: "User", optional: true
  has_many :ships, dependent: :destroy
  has_many :devlogs, dependent: :destroy
  has_many :airtable_queue_items, dependent: :destroy
  has_many :kudos, dependent: :destroy
  has_many :project_notes, dependent: :destroy
  has_one_attached :cover_image

  after_commit :sync_to_airtable, on: [ :create, :update ], if: -> { approved? }
  after_update_commit :process_cover_image_upload, if: -> { cover_image.attached? && cover_image_url.blank? }

  enum :status, { draft: 0, pending: 1, approved: 2, returned: 3, rejected: 4, pitch_approved: 7, pitch_pending: 8 }

  TIERS = %w[tier_1 tier_2 tier_3 tier_4].freeze
  TIER_COIN_RATES = {
    "tier_1" => 7.0,
    "tier_2" => 5.5,
    "tier_3" => 4.5,
    "tier_4" => 4.0
  }.freeze

  validates :name, presence: true
  validates :repo_link, format: { with: /\Ahttps?:\/\/\S+\z/i, message: "must be a valid URL starting with http:// or https://" }, allow_blank: true
  validates :tier, inclusion: { in: TIERS }

  scope :reviewable, -> { where(status: :pending) }
  scope :staff_picks, -> { where.not(staff_pick_at: nil).order(staff_pick_at: :desc) }

  def staff_pick?
    staff_pick_at.present?
  end

  def built?
    built_at.present?
  end

  def airtable_sent?
    airtable_queue_items.where(status: AirtableQueueItem.statuses[:sent]).exists?
  end

  def has_fulfilled_direct_grant?
    Order.where(project_id: id, kind: "direct_grant").where.not(status: :rejected).exists?
  end

  def submit_for_review!
    update!(status: :pending)
  end

  def reviewable?
    draft? || returned? || pitch_approved?
  end

  def advanced?
    tier == "tier_1"
  end

  def normal?
    tier != "tier_1"
  end

  def coin_rate
    TIER_COIN_RATES[tier] || 0.0
  end

  def devlog_hours
    devlogs.sum do |d|
      next 0 unless d.time_spent
      match = d.time_spent.match(/([\d.]+)/)
      match ? match[1].to_f : 0
    end
  end

  def total_hours
    return override_hours.to_f if override_hours.present?

    devlog_hours
  end

  def coins_earned
    return 0.0 unless approved?

    (total_hours * coin_rate * user.streak_multiplier).round(2)
  end

  REVIEW_EVENT_ACTIONS = %w[
    project.pitch_approved project.approved project.returned project.rejected project.reverted_to_draft
    project.build_approved project.build_returned project.build_rejected
    devlog.approved devlog.returned
  ].freeze

  def review_history
    AuditEvent
      .includes(:actor)
      .where(action: REVIEW_EVENT_ACTIONS)
      .where("(target_type = 'Project' AND target_id = :id) OR (metadata @> :meta::jsonb)",
             id: id, meta: { project_id: id }.to_json)
      .order(created_at: :desc)
  end

  private

  def sync_to_airtable
    AirtableSyncJob.perform_later(id)
  end

  def process_cover_image_upload
    UploadCoverImageJob.perform_later(id)
  end
end
