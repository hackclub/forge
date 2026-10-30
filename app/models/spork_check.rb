# == Schema Information
#
# Table name: spork_checks
#
#  id            :bigint           not null, primary key
#  checked_at    :datetime
#  error_message :text
#  match_count   :integer          default(0), not null
#  repo          :string
#  results       :jsonb            not null
#  screen_errors :jsonb            not null
#  verdict       :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  project_id    :bigint           not null
#
# Indexes
#
#  index_spork_checks_on_project_id  (project_id) UNIQUE
#  index_spork_checks_on_verdict     (verdict)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class SporkCheck < ApplicationRecord
  HIT_VERDICTS = %w[exclusive_match shared_template].freeze

  belongs_to :project

  scope :hits, -> { where(verdict: HIT_VERDICTS) }

  def hit?
    HIT_VERDICTS.include?(verdict)
  end
end
