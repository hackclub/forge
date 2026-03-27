# == Schema Information
#
# Table name: feature_flags
#
#  id          :bigint           not null, primary key
#  description :string
#  enabled     :boolean          default(FALSE), not null
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_feature_flags_on_name  (name) UNIQUE
#
class FeatureFlag < ApplicationRecord
  has_paper_trail

  validates :name, presence: true, uniqueness: true

  def self.enabled?(name)
    find_by(name: name)&.enabled? || false
  end
end
