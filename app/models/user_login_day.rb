# == Schema Information
#
# Table name: user_login_days
#
#  id         :bigint           not null, primary key
#  login_on   :date             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_user_login_days_on_login_on              (login_on)
#  index_user_login_days_on_user_id               (user_id)
#  index_user_login_days_on_user_id_and_login_on  (user_id,login_on) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class UserLoginDay < ApplicationRecord
  belongs_to :user
end
