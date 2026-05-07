namespace :support_tickets do
  desc "Delete BTS messages for already-resolved support tickets"
  task cleanup_resolved_bts_messages: :environment do
    sleep_seconds = ENV.fetch("SLEEP", "0.3").to_f
    dry_run = ENV["DRY_RUN"] == "1"

    scope = SupportTicket.resolved.where.not(bts_message_ts: [ nil, "" ])
    total = scope.count
    puts "Found #{total} resolved tickets with a BTS message. Dry run: #{dry_run}."

    deleted = 0
    failed = 0

    scope.find_each.with_index do |ticket, i|
      if dry_run
        puts "[#{i + 1}/#{total}] ticket##{ticket.id} — would delete bts ts=#{ticket.bts_message_ts}"
      else
        SupportTicketJob.delete_bts_message(ticket)
        if ticket.reload.bts_message_ts.blank?
          deleted += 1
          puts "[#{i + 1}/#{total}] ticket##{ticket.id} — deleted"
        else
          failed += 1
          puts "[#{i + 1}/#{total}] ticket##{ticket.id} — delete failed (ts still present)"
        end
      end
    rescue StandardError => e
      failed += 1
      puts "[#{i + 1}/#{total}] ticket##{ticket.id} — error: #{e.class}: #{e.message}"
    ensure
      sleep(sleep_seconds) if sleep_seconds.positive?
    end

    puts "Done. deleted=#{deleted} failed=#{failed} total=#{total}"
  end
end
