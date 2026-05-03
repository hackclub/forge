namespace :devlogs do
  desc "Backfill time_hours for all devlogs with NULL time_hours"
  task backfill_time_hours: :environment do
    unparseable = []
    updated = 0
    skipped = 0

    # Find all devlogs where time_hours is NULL
    Devlog.where(time_hours: nil).find_each do |devlog|
      if devlog.time_spent.blank?
        skipped += 1
        next
      end

      parsed_hours = TimeSpentParser.parse(devlog.time_spent)
      if parsed_hours.present?
        devlog.update_column(:time_hours, parsed_hours)
        updated += 1
        puts "✓ #{devlog.id}: '#{devlog.title}' #{devlog.time_spent.inspect} → #{parsed_hours}h"
      else
        unparseable << {
          id: devlog.id,
          title: devlog.title,
          time_spent: devlog.time_spent,
          project_id: devlog.project_id
        }
        puts "✗ #{devlog.id}: '#{devlog.title}' #{devlog.time_spent.inspect} (UNPARSEABLE)"
      end
    end

    puts "\n" + "=" * 70
    puts "Backfill complete:"
    puts "  Updated: #{updated}"
    puts "  Skipped (no time_spent): #{skipped}"
    puts "  Unparseable: #{unparseable.size}"

    if unparseable.any?
      puts "\nUnparseable entries (flagged for manual review):"
      unparseable.each do |e|
        puts "  - Project #{e[:project_id]}, Devlog #{e[:id]}: #{e[:time_spent].inspect}"
      end
    end
  end
end
