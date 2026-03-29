class AddSlackFieldsToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :slack_channel_id, :string
    add_column :projects, :slack_message_ts, :string
    add_column :projects, :pitch_text, :text
  end
end
