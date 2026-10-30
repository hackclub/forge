class SporkSweepJob < ApplicationJob
  queue_as :background

  def perform
    return unless SporkService.enabled?

    Project.kept.with_github_repo.ids.each { |id| SporkScreenJob.perform_later(id) }
  end
end
