# == Schema Information
#
# Table name: user_activity_days
#
#  id         :bigint           not null, primary key
#  active_on  :date             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_user_activity_days_on_user_id                (user_id)
#  index_user_activity_days_on_user_id_and_active_on  (user_id,active_on) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class UserActivityDay < ApplicationRecord
  belongs_to :user

  validates :active_on, presence: true, uniqueness: { scope: :user_id }
end
