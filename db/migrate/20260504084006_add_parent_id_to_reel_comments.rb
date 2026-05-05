class AddParentIdToReelComments < ActiveRecord::Migration[8.1]
  def change
    add_reference :reel_comments, :parent, null: true, foreign_key: { to_table: :reel_comments, on_delete: :cascade }
  end
end
