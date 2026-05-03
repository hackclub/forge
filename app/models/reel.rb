# == Schema Information
#
# Table name: reels
#
#  id                    :bigint           not null, primary key
#  audio_url             :string
#  comments_count        :integer          default(0), not null
#  duration_seconds      :integer
#  kind                  :string           default("video"), not null
#  kudos_count           :integer          default(0), not null
#  lifetime_payout_coins :decimal(10, 2)   default(0.0), not null
#  title                 :text
#  video_url             :string
#  views_count           :integer          default(0), not null
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  project_id            :bigint           not null
#  user_id               :bigint           not null
#
# Indexes
#
#  index_reels_on_created_at  (created_at)
#  index_reels_on_project_id  (project_id)
#  index_reels_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
class Reel < ApplicationRecord
  KINDS = %w[video image_carousel slideshow].freeze
  MAX_DURATION_SECONDS = 60
  MAX_IMAGES = 10

  COINS_PER_VIEW = 0.001
  COINS_PER_KUDO = 0.05
  MAX_PAYOUT_COINS = 25.0

  has_paper_trail

  belongs_to :project
  belongs_to :user
  has_many :reel_kudos, dependent: :destroy
  has_many :reel_comments, dependent: :destroy
  has_many :reel_images, dependent: :destroy
  has_many :reel_views, dependent: :destroy
  has_many :reel_payout_requests, dependent: :destroy

  validates :kind, inclusion: { in: KINDS }
  validates :video_url, presence: true, if: -> { kind == "video" }
  validates :audio_url, presence: true, if: -> { kind == "slideshow" }
  validates :duration_seconds, numericality: { greater_than: 0, less_than_or_equal_to: MAX_DURATION_SECONDS }, allow_nil: true
  validates :title, length: { maximum: 200 }

  scope :recent, -> { order(created_at: :desc) }

  def kudoed_by?(user)
    return false unless user
    reel_kudos.exists?(user_id: user.id)
  end

  def payout_target
    raw = (views_count * COINS_PER_VIEW) + (kudos_count * COINS_PER_KUDO)
    [ raw, MAX_PAYOUT_COINS ].min.round(2)
  end

  def payout_owed
    [ payout_target - lifetime_payout_coins.to_f, 0 ].max.round(2)
  end

  def request_payout!
    return nil if user.nil? || user.is_banned
    return nil if reel_payout_requests.pending.exists?
    amount = payout_owed
    return nil if amount <= 0
    reel_payout_requests.create!(amount: amount)
  end

  def pending_payout
    reel_payout_requests.pending.sum(:amount).to_f
  end
end
