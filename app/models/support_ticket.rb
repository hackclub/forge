class SupportTicket < ApplicationRecord
  has_paper_trail

  enum :status, { open: 0, claimed: 1, resolved: 2 }

  validates :slack_user_id, :channel_id, :thread_ts, :bts_channel_id, :original_text, presence: true
  validates :thread_ts, uniqueness: true

  scope :recent, -> { order(created_at: :desc) }

  def slack_thread_url
    "https://hackclub.slack.com/archives/#{channel_id}/p#{thread_ts.to_s.delete('.')}"
  end

  def bts_thread_url
    return nil unless bts_message_ts.present?
    "https://hackclub.slack.com/archives/#{bts_channel_id}/p#{bts_message_ts.to_s.delete('.')}"
  end
end
