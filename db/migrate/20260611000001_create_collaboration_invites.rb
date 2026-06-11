class CreateCollaborationInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :collaboration_invites do |t|
      t.references :project, null: false, foreign_key: true
      t.references :inviter, null: false, foreign_key: { to_table: :users }
      t.references :invitee, null: false, foreign_key: { to_table: :users }
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :collaboration_invites, [ :project_id, :invitee_id ],
              unique: true,
              where: "status = 0",
              name: "index_collaboration_invites_on_project_invitee_pending"
    add_index :collaboration_invites, :status
  end
end
