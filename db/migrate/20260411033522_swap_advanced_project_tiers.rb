class SwapAdvancedProjectTiers < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tmp_tier' WHERE tier = 'tier_1';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_1' WHERE tier = 'tier_4';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_4' WHERE tier = 'tmp_tier';
    SQL
    change_column_default :projects, :tier, "tier_4"
  end

  def down
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tmp_tier' WHERE tier = 'tier_1';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_1' WHERE tier = 'tier_4';
    SQL
    execute <<~SQL.squish
      UPDATE projects SET tier = 'tier_4' WHERE tier = 'tmp_tier';
    SQL
    change_column_default :projects, :tier, "tier_1"
  end
end
