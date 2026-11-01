class AddInnocentToSporkChecks < ActiveRecord::Migration[8.1]
  def change
    add_column :spork_checks, :innocent_at, :datetime
    add_column :spork_checks, :innocent_note, :text
    add_reference :spork_checks, :innocent_by, foreign_key: { to_table: :users }
    add_index :spork_checks, :innocent_at
  end
end
