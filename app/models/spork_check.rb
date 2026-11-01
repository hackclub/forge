# == Schema Information
#
# Table name: spork_checks
#
#  id             :bigint           not null, primary key
#  checked_at     :datetime
#  checking_at    :datetime
#  error_message  :text
#  innocent_at    :datetime
#  innocent_note  :text
#  match_count    :integer          default(0), not null
#  repo           :string
#  results        :jsonb            not null
#  screen_errors  :jsonb            not null
#  verdict        :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  checking_by_id :bigint
#  innocent_by_id :bigint
#  project_id     :bigint           not null
#
# Indexes
#
#  index_spork_checks_on_checking_by_id  (checking_by_id)
#  index_spork_checks_on_innocent_at     (innocent_at)
#  index_spork_checks_on_innocent_by_id  (innocent_by_id)
#  index_spork_checks_on_project_id      (project_id) UNIQUE
#  index_spork_checks_on_verdict         (verdict)
#
# Foreign Keys
#
#  fk_rails_...  (checking_by_id => users.id)
#  fk_rails_...  (innocent_by_id => users.id)
#  fk_rails_...  (project_id => projects.id)
#
class SporkCheck < ApplicationRecord
  HIT_VERDICTS = %w[exclusive_match shared_template].freeze

  belongs_to :project
  belongs_to :innocent_by, class_name: "User", optional: true
  belongs_to :checking_by, class_name: "User", optional: true

  scope :hits, -> { where(verdict: HIT_VERDICTS) }
  scope :innocent, -> { where.not(innocent_at: nil) }
  scope :not_innocent, -> { where(innocent_at: nil) }
  scope :checking, -> { where.not(checking_at: nil) }
  scope :for_active_owners, -> { joins(project: :user).where(users: { is_banned: false }) }
  scope :queued, -> { hits.not_innocent.for_active_owners.merge(Project.kept.not_flagged_for_review) }

  def hit?
    HIT_VERDICTS.include?(verdict)
  end

  def innocent?
    innocent_at.present?
  end

  def checking?
    checking_at.present?
  end
end
