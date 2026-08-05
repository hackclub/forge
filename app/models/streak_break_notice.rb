# == Schema Information
#
# Table name: streak_break_notices
#
#  id            :bigint           not null, primary key
#  broke_on      :date             not null
#  streak_length :integer          not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  user_id       :bigint           not null
#
# Indexes
#
#  index_streak_break_notices_on_user_id               (user_id)
#  index_streak_break_notices_on_user_id_and_broke_on  (user_id,broke_on) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class StreakBreakNotice < ApplicationRecord
  belongs_to :user

  validates :broke_on, presence: true
  validates :streak_length, presence: true, numericality: { greater_than: 0 }
  validates :user_id, uniqueness: { scope: :broke_on }
end
