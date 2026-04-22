class AddProjectToKudos < ActiveRecord::Migration[8.1]
  def change
    add_reference :kudos, :project, null: true, foreign_key: true
  end
end
