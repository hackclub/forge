class SyncAllJournalsJob < ApplicationJob
  queue_as :background

  def perform
    delay = ENV.fetch("SYNC_ALL_JOURNALS_DELAY", "1").to_f

    Project.kept
      .where(devlog_mode: "git")
      .where.not(repo_link: [ nil, "" ])
      .where.not(status: :rejected)
      .find_each(batch_size: 50) do |project|
      begin
        SyncJournalJob.perform_now(project.id)
      rescue StandardError => e
        Rails.logger.error("SyncAllJournalsJob: project #{project.id} failed: #{e.class}: #{e.message}")
      end
      sleep delay if delay.positive?
    end
  end
end
