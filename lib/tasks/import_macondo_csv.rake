namespace :macondo do
  desc "Import transferred Macondo projects from a CSV export (CSV=path/to/macondo.csv [DRY_RUN=1])"
  task import_csv: :environment do
    path = ENV["CSV"].presence || abort("Set CSV=path/to/macondo.csv")
    abort("No such file: #{path}") unless File.exist?(path)
    dry_run = ENV["DRY_RUN"].present?

    result = MacondoCsvImport.call(File.read(path), dry_run: dry_run)

    result[:imported].each do |row|
      puts "#{dry_run ? "[dry run] " : ""}✓ #{row[:macondo_project_id]} #{row[:name]} → #{row[:email]} (#{row[:devlogs]} devlogs)"
    end

    puts "\n" + ("=" * 70)
    puts "Imported: #{result[:imported].size}"
    puts "Already imported: #{result[:already_imported]}"
    puts "Placeholder account created for the owner: #{result[:placeholder_owners].size}"
    result[:placeholder_owners].each { |row| puts "  - #{row[:macondo_project_id]}: #{row[:email]}" }
    puts "Placeholder account created for a collaborator: #{result[:placeholder_collaborators].size}"
    result[:placeholder_collaborators].each { |row| puts "  - #{row[:macondo_project_id]}: #{row[:email]}" }
    puts "Failed: #{result[:failures].size}"
    result[:failures].each { |row| puts "  - #{row[:macondo_project_id]}: #{row[:message]}" }
  end
end
