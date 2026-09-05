# == Schema Information
#
# Table name: orphaned_lapse_links
#
#  id         :bigint           not null, primary key
#  lapse_url  :string           not null
#  title      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  project_id :bigint           not null
#
# Indexes
#
#  index_orphaned_lapse_links_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class OrphanedLapseLink < ApplicationRecord
  belongs_to :project

  validates :lapse_url, format: { with: /\Ahttps?:\/\/\S+\z/i, message: "must be a valid URL" }, allow_blank: false
end
