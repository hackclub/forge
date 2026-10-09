class AddProjectToCoinAdjustments < ActiveRecord::Migration[8.1]
  def change
    add_reference :coin_adjustments, :project, foreign_key: true
  end
end
