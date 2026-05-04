namespace :devlogs do
  desc "Backfill time_hours for all devlogs with NULL time_hours"
  task backfill_time_hours: :environment do
    unparseable = []
    updated = 0
    skipped = 0
    max_time_hours = 1_000_000

    # Find all devlogs where time_hours is NULL
    Devlog.where(time_hours: nil).find_each do |devlog|
      if devlog.time_spent.blank?
        skipped += 1
        next
      end

      parsed_hours = TimeSpentParser.parse(devlog.time_spent)
      if parsed_hours.present?
        if parsed_hours.abs >= max_time_hours
          unparseable << {
            id: devlog.id,
            title: devlog.title,
            time_spent: devlog.time_spent,
            project_id: devlog.project_id,
            reason: "parsed value #{parsed_hours} exceeds max allowed #{max_time_hours - 0.01}"
          }
          puts "✗ #{devlog.id}: '#{devlog.title}' #{devlog.time_spent.inspect} (OUT OF RANGE: #{parsed_hours}h)"
          next
        end

        begin
          devlog.update_column(:time_hours, parsed_hours)
          updated += 1
          puts "✓ #{devlog.id}: '#{devlog.title}' #{devlog.time_spent.inspect} → #{parsed_hours}h"
        rescue ActiveRecord::RangeError, ActiveRecord::StatementInvalid => e
          unparseable << {
            id: devlog.id,
            title: devlog.title,
            time_spent: devlog.time_spent,
            project_id: devlog.project_id,
            reason: e.message
          }
          puts "✗ #{devlog.id}: '#{devlog.title}' #{devlog.time_spent.inspect} (ERROR: #{e.class})"
        end
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
        reason = e[:reason].present? ? " (#{e[:reason]})" : ""
        puts "  - Project #{e[:project_id]}, Devlog #{e[:id]}: #{e[:time_spent].inspect}#{reason}"
      end
    end
  end
end
