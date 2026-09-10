def diagnose_format(content)
  body = content.sub(/\A---\s*\n.*?\n---\s*\n/m, "")
  levels = body.scan(/^(\#+)\s+.+$/).map { |h| h.first.length }.tally.sort.to_h

  return "empty after frontmatter" if body.strip.empty?
  return "bold date lines, no headings" if levels.empty? && body.match?(/^\s*\*\*.+\*\*\s*$/)
  return "plain text, no headings" if levels.empty?
  return "deep headings only (#{levels.keys.join(', ')}) - parser only reads 1, 2" if (levels.keys & [ 1, 2 ]).empty?

  "headings " + levels.map { |lvl, n| "#{'#' * lvl}x#{n}" }.join(" ")
end

namespace :devlogs do
  desc "Report git-journal devlogs with no matching heading in the current JOURNAL.md"
  task audit_fabricated: :environment do
    delay = ENV.fetch("AUDIT_DELAY", "0.3").to_f
    job = SyncJournalJob.new

    fully_fabricated = []
    partial = []
    unreachable = []

    scope = Project.kept
      .where(devlog_mode: "git")
      .where.not(repo_link: [ nil, "" ])
      .where.not(status: :rejected)
      .joins(:devlogs)
      .distinct

    total = scope.count
    puts "Auditing #{total} git-mode projects with devlogs\n\n"

    scope.find_each(batch_size: 50).with_index do |project, i|
      print "\r[#{i + 1}/#{total}] project #{project.id}".ljust(60)

      parsed_repo = job.send(:parse_repo_url, project.repo_link)
      unless parsed_repo
        unreachable << { project: project, reason: "unparseable repo_link" }
        next
      end

      content = job.send(:fetch_journal, parsed_repo, project.journal_branch.presence)
      if content.blank?
        unreachable << { project: project, reason: "JOURNAL.md not fetchable" }
        next
      end

      heading_titles = job.send(:parse_journal_entries, content).map { |e| e[:title] }
      devlogs = project.devlogs.to_a
      orphans = devlogs.reject { |d| heading_titles.include?(d.title) }

      next if orphans.empty?

      record = {
        project: project,
        owner: project.user,
        orphans: orphans,
        heading_count: heading_titles.size,
        journal_format: diagnose_format(content),
        hours: orphans.sum { |d| d.time_hours.to_f }
      }

      heading_titles.empty? ? fully_fabricated << record : partial << record
    ensure
      sleep delay if delay.positive?
    end

    puts "\r".ljust(60)

    report = lambda do |label, rows|
      next if rows.empty?

      puts "\n#{label} (#{rows.size} projects)"
      puts "=" * 70
      rows.sort_by { |r| -r[:hours] }.each do |r|
        puts "project #{r[:project].id}  #{r[:project].name}"
        puts "  owner: #{r[:owner].display_name} <#{r[:owner].email}>  tier: #{r[:project].tier}  status: #{r[:project].status}"
        puts "  repo: #{r[:project].repo_link}"
        puts "  orphan devlogs: #{r[:orphans].size}  headings in journal: #{r[:heading_count]}  hours: #{r[:hours].round(2)}"
        puts "  journal format: #{r[:journal_format]}"
        r[:orphans].each do |d|
          flag = d.lapse_url.present? ? " [has lapse_url]" : ""
          puts "    ##{d.id}  #{d.entry_date}  #{d.time_hours.to_f.round(2)}h  #{d.title.truncate(60).inspect}#{flag}"
        end
        puts
      end
    end

    report.call("FULLY FABRICATED - journal has no headings at all", fully_fabricated)
    report.call("PARTIAL - some devlog titles match no heading (fabricated or renamed)", partial)

    if unreachable.any?
      puts "\nCOULD NOT CHECK (#{unreachable.size} projects)"
      puts "=" * 70
      unreachable.each { |u| puts "  project #{u[:project].id}: #{u[:reason]}" }
    end

    puts "\n" + "=" * 70
    puts "Projects audited:        #{total}"
    puts "Fully fabricated:        #{fully_fabricated.size} projects, #{fully_fabricated.sum { |r| r[:orphans].size }} devlogs, #{fully_fabricated.sum { |r| r[:hours] }.round(2)}h"
    puts "Partial orphans:         #{partial.size} projects, #{partial.sum { |r| r[:orphans].size }} devlogs, #{partial.sum { |r| r[:hours] }.round(2)}h"
    puts "Could not check:         #{unreachable.size} projects"
    puts "\nRead-only. Nothing was modified."
  end
end
