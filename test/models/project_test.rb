# == Schema Information
#
# Table name: projects
#
#  id               :bigint           not null, primary key
#  description      :text
#  discarded_at     :datetime
#  name             :string           not null
#  pitch_text       :text
#  repo_link        :string
#  review_feedback  :text
#  reviewed_at      :datetime
#  slack_message_ts :string
#  status           :integer          default("draft"), not null
#  tags             :string           default([]), not null, is an Array
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  reviewer_id      :bigint
#  slack_channel_id :string
#  user_id          :bigint           not null
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
require "test_helper"

class ProjectTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
