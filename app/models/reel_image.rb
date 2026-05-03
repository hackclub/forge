# == Schema Information
#
# Table name: reel_images
#
#  id         :bigint           not null, primary key
#  image_url  :string           not null
#  position   :integer          default(0), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  reel_id    :bigint           not null
#
# Indexes
#
#  index_reel_images_on_reel_id               (reel_id)
#  index_reel_images_on_reel_id_and_position  (reel_id,position)
#
# Foreign Keys
#
#  fk_rails_...  (reel_id => reels.id)
#
class ReelImage < ApplicationRecord
  belongs_to :reel

  validates :image_url, presence: true
  validates :position, numericality: { greater_than_or_equal_to: 0 }

  default_scope -> { order(:position) }
end
