namespace :users do
  desc "Grant one streak freeze to any user that has none"
  task backfill_streak_freezes: :environment do
    dry_run = ENV["DRY_RUN"] == "1"

    scope = User.where(streak_freezes: 0)
    total = scope.count
    puts "Found #{total} users with no streak freezes. Dry run: #{dry_run}."

    if dry_run || total.zero?
      puts "Done."
      next
    end

    updated = scope.update_all(streak_freezes: 1)
    puts "Granted 1 streak freeze to #{updated} users."
  end
end
