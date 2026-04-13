# == Schema Information
#
# Table name: users
#
#  id                  :bigint           not null, primary key
#  address_line1       :string
#  address_line2       :string
#  avatar              :string           not null
#  ban_reason          :text
#  birthday            :date
#  city                :string
#  country             :string
#  discarded_at        :datetime
#  display_name        :string           not null
#  email               :string           not null
#  first_name          :string
#  fulfillment_regions :string           default([]), not null, is an Array
#  git_instance_url    :string
#  git_provider        :string           default("github")
#  github_username     :string
#  hca_token           :text
#  is_adult            :boolean          default(FALSE), not null
#  is_banned           :boolean          default(FALSE), not null
#  is_beta_approved    :boolean          default(FALSE), not null
#  last_name           :string
#  permissions         :string           default([]), not null, is an Array
#  phone_number        :string
#  postal_code         :string
#  referral_code       :string
#  region              :string           default("rest_of_world")
#  roles               :string           default([]), not null, is an Array
#  shop_unlocked       :boolean          default(FALSE), not null
#  state               :string
#  timezone            :string           not null
#  verification_status :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  hca_id              :string           not null
#  slack_id            :string           not null
#
# Indexes
#
#  index_users_on_discarded_at   (discarded_at)
#  index_users_on_referral_code  (referral_code) UNIQUE
#
require "test_helper"

class UserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
