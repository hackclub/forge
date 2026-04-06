# == Schema Information
#
# Table name: projects
#
#  id                           :bigint           not null, primary key
#  budget                       :text
#  cover_image_url              :string
#  description                  :text
#  devlog_mode                  :string
#  discarded_at                 :datetime
#  hcb_grant_link               :string
#  name                         :string           not null
#  override_hours               :decimal(, )
#  override_hours_justification :text
#  pitch_text                   :text
#  readme_cache                 :text
#  readme_fetched_at            :datetime
#  repo_link                    :string
#  review_feedback              :text
#  reviewed_at                  :datetime
#  slack_message_ts             :string
#  status                       :integer          default("draft"), not null
#  subtitle                     :string
#  tags                         :string           default([]), not null, is an Array
#  tier                         :string           default("normal"), not null
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  reviewer_id                  :bigint
#  slack_channel_id             :string
#  user_id                      :bigint           not null
#
# Indexes
#
#  index_projects_on_discarded_at  (discarded_at)
#  index_projects_on_status        (status)
#  index_projects_on_tags          (tags) USING gin
#  index_projects_on_user_id       (user_id)
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
  has_one_attached :cover_image

  after_commit :sync_to_airtable, on: [ :create, :update ], if: -> { approved? || build_approved? }
  after_update_commit :process_cover_image_upload, if: -> { cover_image.attached? && cover_image_url.blank? }

  enum :status, { draft: 0, pending: 1, approved: 2, returned: 3, rejected: 4, build_pending: 5, build_approved: 6 }

  validates :name, presence: true
  validates :repo_link, format: { with: /\Ahttps?:\/\/\S+\z/i, message: "must be a valid URL starting with http:// or https://" }, allow_blank: true
  validates :tier, inclusion: { in: %w[normal advanced] }

  scope :reviewable, -> { where(status: :pending) }

  def submit_for_review!
    update!(status: :pending)
  end

  def submit_build_for_review!
    update!(status: :build_pending)
  end

  def reviewable?
    draft? || returned?
  end

  def advanced?
    tier == "advanced"
  end

  def normal?
    tier == "normal"
  end

  def total_hours
    return override_hours.to_f if override_hours.present?

    devlogs.sum do |d|
      next 0 unless d.time_spent
      match = d.time_spent.match(/([\d.]+)\s*(?:hrs?|hours?)/i)
      match ? match[1].to_f : 0
    end
  end

  private

  def sync_to_airtable
    AirtableSyncJob.perform_later(id)
  end

  def process_cover_image_upload
    UploadCoverImageJob.perform_later(id)
  end
end
