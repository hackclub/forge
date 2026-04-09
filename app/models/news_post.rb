# == Schema Information
#
# Table name: news_posts
#
#  id           :bigint           not null, primary key
#  body         :text             not null
#  published    :boolean          default(FALSE), not null
#  published_at :datetime
#  title        :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  author_id    :bigint           not null
#
# Indexes
#
#  index_news_posts_on_author_id                   (author_id)
#  index_news_posts_on_published_and_published_at  (published,published_at)
#
# Foreign Keys
#
#  fk_rails_...  (author_id => users.id)
#
class NewsPost < ApplicationRecord
  has_paper_trail

  belongs_to :author, class_name: "User"

  validates :title, presence: true
  validates :body, presence: true

  scope :published, -> { where(published: true).order(published_at: :desc) }

  before_save :set_published_at

  private

  def set_published_at
    self.published_at ||= Time.current if published?
    self.published_at = nil unless published?
  end
end
