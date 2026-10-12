class AddMacondoImportFieldsToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :macondo_project_id, :string
    add_column :projects, :macondo_tier, :integer
    add_column :projects, :macondo_tier_confirmed_at, :datetime
    add_index :projects, :macondo_project_id, unique: true
  end
end
