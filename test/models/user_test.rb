# == Schema Information
#
# Table name: users
#
#  id                  :bigint           not null, primary key
#  avatar              :string           not null
#  discarded_at        :datetime
#  display_name        :string           not null
#  email               :string           not null
#  hca_token           :text
#  is_adult            :boolean          default(FALSE), not null
#  is_banned           :boolean          default(FALSE), not null
#  roles               :string           default([]), not null, is an Array
#  timezone            :string           not null
#  verification_status :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  hca_id              :string           not null
#  slack_id            :string           not null
#
# Indexes
#
#  index_users_on_discarded_at  (discarded_at)
#
require "test_helper"

class UserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
