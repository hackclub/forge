class AddJournalParseFailedToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :journal_parse_failed, :boolean, default: false, null: false
  end
end
