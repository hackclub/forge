class AddCoinsAwardedToProjects < ActiveRecord::Migration[8.1]
  def up
    add_column :projects, :coins_awarded, :decimal, precision: 10, scale: 2

    # Freeze each already-approved project at its current value so balances stop
    # drifting when the weekly guild multiplier recomputes. There's no historical
    # record of the guild multiplier at each approval, so "now" is the best anchor.
    Project.reset_column_information
    Project.where(status: :approved).find_each do |project|
      project.update_column(:coins_awarded, project.coins_earned)
    end
  end

  def down
    remove_column :projects, :coins_awarded
  end
end
