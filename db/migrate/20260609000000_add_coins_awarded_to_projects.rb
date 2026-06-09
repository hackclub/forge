class AddCoinsAwardedToProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :coins_awarded, :decimal, precision: 10, scale: 2

    Project.reset_column_information
    Project.where(status: :approved).find_each do |project|
      project.update_column(:coins_awarded, project.coins_earned)
    end
  end

  def down
    remove_column :projects, :coins_awarded
  end
end
