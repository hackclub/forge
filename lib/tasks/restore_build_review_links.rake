namespace :projects do
  desc "Restore build review links cleared by project edits and mark linked projects built. DRY_RUN=1 to preview."
  task restore_build_review_links: :environment do
    dry_run = ENV["DRY_RUN"].present?
    restored = 0
    marked_built = 0

    Project.kept.where(build_review: true, linked_project_id: nil).find_each do |review|
      previous_id = review.versions.reorder(created_at: :desc, id: :desc).lazy.filter_map { |v| v.reify&.linked_project_id }.first
      next unless previous_id

      target = Project.kept.find_by(id: previous_id, user_id: review.user_id, build_review: false)
      if target.nil?
        puts "✗ Build review #{review.id}: previous link #{previous_id} no longer valid"
        next
      end
      if Project.kept.where(build_review: true, linked_project_id: target.id).exists?
        puts "✗ Build review #{review.id}: project #{target.id} already has another build review"
        next
      end

      review.update_column(:linked_project_id, target.id) unless dry_run
      restored += 1
      puts "✓ Build review #{review.id}: relinked to project #{target.id} (#{target.name})"
    end

    Project.kept.where(build_review: true, status: :approved).where.not(linked_project_id: nil).includes(:linked_project).find_each do |review|
      target = review.linked_project
      next if target.nil? || target.built?

      unless dry_run
        unless target.update(built_at: review.reviewed_at || Time.current)
          puts "✗ Project #{target.id}: #{target.errors.full_messages.join(', ')}"
          next
        end
        AuditEvent.create!(action: "project.marked_built", target: target, target_label: target.name, metadata: { via: "build_review_backfill", build_review_id: review.id })
      end
      marked_built += 1
      puts "✓ Project #{target.id} (#{target.name}): marked built via build review #{review.id}"
    end

    puts "\n#{dry_run ? '[DRY RUN] ' : ''}Relinked: #{restored}, marked built: #{marked_built}"
  end
end
