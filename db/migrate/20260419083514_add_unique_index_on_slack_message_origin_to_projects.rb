class AddUniqueIndexOnSlackMessageOriginToProjects < ActiveRecord::Migration[8.1]
  def change
    add_index :projects,
      [ :slack_channel_id, :slack_message_ts ],
      unique: true,
      where: "slack_channel_id IS NOT NULL AND slack_message_ts IS NOT NULL",
      name: "index_projects_on_slack_origin"
  end
end
