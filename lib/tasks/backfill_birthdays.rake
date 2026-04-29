namespace :users do
  desc "Backfill missing birthdays from HCA for users where birthday is nil"
  task backfill_birthdays: :environment do
    sleep_seconds = ENV.fetch("SLEEP", "0.2").to_f
    dry_run = ENV["DRY_RUN"] == "1"

    scope = User.where(birthday: nil).where.not(hca_token: [ nil, "" ])
    total = scope.count
    puts "Found #{total} users with missing birthdays and an HCA token. Dry run: #{dry_run}."

    updated = 0
    no_response = 0
    no_birthday = 0
    failed = 0
    sample_logged = false

    scope.find_each.with_index do |user, i|
      response = HcaService.me(user.hca_token)

      if response.nil?
        no_response += 1
        puts "[#{i + 1}/#{total}] user##{user.id} — HCA /me failed (token expired or unauthorized)"
        next
      end

      unless sample_logged
        puts "Sample HCA response keys for user##{user.id}: #{response.keys.inspect}"
        if response["identity"].is_a?(Hash)
          puts "Sample identity keys: #{response["identity"].keys.inspect}"
        end
        sample_logged = true
      end

      identity = response["identity"] || {}
      raw = identity["birthday"]

      if raw.blank?
        no_birthday += 1
        puts "[#{i + 1}/#{total}] user##{user.id} — HCA returned identity but no birthday key/value"
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

    puts "Done. updated=#{updated} no_response=#{no_response} no_birthday=#{no_birthday} failed=#{failed} total=#{total}"
  end
end
