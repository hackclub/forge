# == Schema Information
#
# Table name: audit_events
#
#  id           :bigint           not null, primary key
#  action       :string           not null
#  ip_address   :string
#  metadata     :jsonb            not null
#  target_label :string
#  target_type  :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  actor_id     :bigint
#  target_id    :bigint
#
# Indexes
#
#  index_audit_events_on_action                     (action)
#  index_audit_events_on_actor_id                   (actor_id)
#  index_audit_events_on_created_at                 (created_at)
#  index_audit_events_on_target_type_and_target_id  (target_type,target_id)
#
# Foreign Keys
#
#  fk_rails_...  (actor_id => users.id)
#
require "test_helper"

class AuditEventTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
