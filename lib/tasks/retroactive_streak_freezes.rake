namespace :users do
  desc "Retroactively apply streak freezes for users whose streak broke during a gap they had freezes for (DRY_RUN=1 to preview)"
  task retroactive_streak_freezes: :environment do
    dry_run = ENV["DRY_RUN"] == "1"
    affected = 0

    User.where("streak_freezes > 0").find_each do |user|
      today = user.today_in_zone
      last = user.activity_days.where("active_on < ?", today).maximum(:active_on)
      next if last.nil?

      gap = (today - last).to_i - 1
      next if gap <= 0

      to_fill = [ gap, user.streak_freezes ].min

      puts "user=#{user.id} (#{user.display_name}): last=#{last}, gap=#{gap}d, freezes=#{user.streak_freezes} -> fill #{to_fill} day(s)"
      affected += 1

      next if dry_run

      user.transaction do
        to_fill.times do |offset|
          user.activity_days.find_or_create_by!(active_on: today - (offset + 1))
        end
        user.decrement!(:streak_freezes, to_fill)
      end
    end

    puts ""
    puts "#{affected} user(s)#{dry_run ? ' would be' : ''} affected. Dry run: #{dry_run}."
  end
end
