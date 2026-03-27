# == Schema Information
#
# Table name: projects
#
#  id              :bigint           not null, primary key
#  description     :text
#  discarded_at    :datetime
#  name            :string           not null
#  repo_link       :string
#  review_feedback :text
#  reviewed_at     :datetime
#  status          :integer          default("draft"), not null
#  tags            :string           default([]), not null, is an Array
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  reviewer_id     :bigint
#  user_id         :bigint           not null
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
class Project < ApplicationRecord
  include Discardable
  include PgSearch::Model

  has_paper_trail

  pg_search_scope :search, against: [ :name, :description ], using: { tsearch: { prefix: true } }

  belongs_to :user
  belongs_to :reviewer, class_name: "User", optional: true
  has_many :ships, dependent: :destroy

  enum :status, { draft: 0, pending: 1, approved: 2, returned: 3, rejected: 4 }

  validates :name, presence: true
  validates :repo_link, format: { with: /\Ahttps?:\/\/\S+\z/i, message: "must be a valid URL starting with http:// or https://" }, allow_blank: true

  scope :reviewable, -> { where(status: :pending) }

  def submit_for_review!
    update!(status: :pending)
  end

  def reviewable?
    draft? || returned?
  end
end
