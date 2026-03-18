class ChangeHcaIdToNotNull < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :hca_id, false
  end
end
