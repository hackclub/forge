# == Schema Information
#
# Table name: project_notes
#
#  id         :bigint           not null, primary key
#  content    :text             not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  author_id  :bigint           not null
#  project_id :bigint           not null
#
# Indexes
#
#  index_project_notes_on_author_id   (author_id)
#  index_project_notes_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (author_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#
require "test_helper"

class ProjectNoteTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
