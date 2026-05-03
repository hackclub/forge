class ReelPayoutJob < ApplicationJob
  queue_as :background

  def perform
    requested = 0
    Reel.includes(:user).find_each do |reel|
      requested += 1 if reel.request_payout!
    rescue StandardError => e
      Rails.logger.error("[ReelPayoutJob] reel #{reel.id} failed: #{e.class}: #{e.message}")
    end
    Rails.logger.info("[ReelPayoutJob] queued #{requested} payout requests for review")
  end
end
