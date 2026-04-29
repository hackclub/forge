namespace :users do
  desc "Backfill missing birthdays from HCA for users where birthday is nil"
  task backfill_birthdays: :environment do
    sleep_seconds = ENV.fetch("SLEEP", "0.2").to_f
    dry_run = ENV["DRY_RUN"] == "1"

    scope = User.where(birthday: nil).where.not(hca_token: [ nil, "" ])
    total = scope.count
    puts "Found #{total} users with missing birthdays and an HCA token. Dry run: #{dry_run}."

    updated = 0
    skipped = 0
    failed = 0

    scope.find_each.with_index do |user, i|
      identity = HcaService.identity(user.hca_token)
      raw = identity["birthday"] if identity.is_a?(Hash)

      if raw.blank?
        skipped += 1
        puts "[#{i + 1}/#{total}] user##{user.id} — no birthday in HCA identity"
        next
      end

      birthday = begin
        Date.parse(raw.to_s)
      rescue StandardError
        nil
      end

      if birthday.nil?
        failed += 1
        puts "[#{i + 1}/#{total}] user##{user.id} — could not parse #{raw.inspect}"
        next
      end

      if dry_run
        puts "[#{i + 1}/#{total}] user##{user.id} — would set birthday=#{birthday}"
      else
        user.update!(birthday: birthday)
        updated += 1
        puts "[#{i + 1}/#{total}] user##{user.id} — set birthday=#{birthday}"
      end
    rescue StandardError => e
      failed += 1
      puts "[#{i + 1}/#{total}] user##{user.id} — error: #{e.class}: #{e.message}"
    ensure
      sleep(sleep_seconds) if sleep_seconds.positive?
    end

    puts "Done. updated=#{updated} skipped=#{skipped} failed=#{failed} total=#{total}"
  end
end
