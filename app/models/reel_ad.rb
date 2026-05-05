# == Schema Information
#
# Table name: reel_ads
#
#  id                :bigint           not null, primary key
#  click_url         :string
#  clicks_count      :integer          default(0), not null
#  duration_seconds  :integer
#  enabled           :boolean          default(TRUE), not null
#  impressions_count :integer          default(0), not null
#  title             :string           not null
#  video_url         :string           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
# Indexes
#
#  index_reel_ads_on_enabled  (enabled)
#
class ReelAd < ApplicationRecord
  has_paper_trail

  validates :title, presence: true, length: { maximum: 200 }
  validates :video_url, presence: true
  validates :click_url, length: { maximum: 2000 }, allow_blank: true

  scope :enabled, -> { where(enabled: true) }
  scope :recent, -> { order(created_at: :desc) }

  def record_impression!
    self.class.where(id: id).update_all("impressions_count = impressions_count + 1")
  end

  def record_click!
    self.class.where(id: id).update_all("clicks_count = clicks_count + 1")
  end
end
