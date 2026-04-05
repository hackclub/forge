class AddBetaApprovedToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :is_beta_approved, :boolean, default: false, null: false
  end
end
