class AddCheckingToSporkChecks < ActiveRecord::Migration[8.1]
  def change
    add_column :spork_checks, :checking_at, :datetime
    add_reference :spork_checks, :checking_by, foreign_key: { to_table: :users }
  end
end
