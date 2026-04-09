# == Schema Information
#
# Table name: support_tickets
#
#  id                   :bigint           not null, primary key
#  bts_message_ts       :string
#  claimed_at           :datetime
#  claimed_by_name      :string
#  original_text        :text             not null
#  resolved_at          :datetime
#  resolved_by_name     :string
#  slack_avatar_url     :string
#  slack_display_name   :string
#  status               :integer          default("open"), not null
#  thread_ts            :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  bts_channel_id       :string           not null
#  channel_id           :string           not null
#  claimed_by_slack_id  :string
#  resolved_by_slack_id :string
#  slack_user_id        :string           not null
#
# Indexes
#
#  index_support_tickets_on_bts_message_ts  (bts_message_ts)
#  index_support_tickets_on_status          (status)
#  index_support_tickets_on_thread_ts       (thread_ts) UNIQUE
#
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
