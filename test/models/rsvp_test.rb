# == Schema Information
#
# Table name: rsvps
#
#  id         :bigint           not null, primary key
#  email      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_rsvps_on_email  (email) UNIQUE
#
require "test_helper"

class RsvpTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
