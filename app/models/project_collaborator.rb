# == Schema Information
#
# Table name: project_collaborators
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  project_id :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_project_collaborators_on_project_id              (project_id)
#  index_project_collaborators_on_project_id_and_user_id  (project_id,user_id) UNIQUE
#  index_project_collaborators_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
class ProjectCollaborator < ApplicationRecord
  has_paper_trail

  belongs_to :project
  belongs_to :user

  validates :user_id, uniqueness: { scope: :project_id, message: "is already a collaborator on this project" }
  validate :user_is_not_owner
  validate :project_allows_collaborators
  validate :team_size_within_cap, on: :create

  private

  def user_is_not_owner
    errors.add(:user, "already owns this project") if project && user_id == project.user_id
  end

  def project_allows_collaborators
    errors.add(:project, "build reviews can't have collaborators") if project&.build_review?
  end

  def team_size_within_cap
    return unless project

    # +1 for the owner, +1 for this new collaborator
    if project.project_collaborators.where.not(id: id).count + 2 > Project::MAX_TEAM_SIZE
      errors.add(:project, "team is full (max #{Project::MAX_TEAM_SIZE} members)")
    end
  end
end
