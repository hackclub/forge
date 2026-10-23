namespace :slack do
  desc "Invite every active user with a Slack ID to #forge, skipping anyone who left it before"
  task invite_all_to_forge: :environment do
    dry_run = ENV["DRY_RUN"] == "1"
    invited = SlackForgeChannelInviteJob.perform_now(dry_run: dry_run)
    puts "#{dry_run ? 'Would invite' : 'Invited'} #{invited.size} users to #forge"
  end
end
