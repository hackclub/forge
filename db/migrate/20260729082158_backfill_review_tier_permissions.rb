class BackfillReviewTierPermissions < ActiveRecord::Migration[8.1]
  TIER_PERMISSIONS = %w[review_tier_1 review_tier_2 review_tier_3 review_tier_4].freeze

  def up
    User.where("'pending_reviews' = ANY(permissions)").find_each do |user|
      user.update_columns(permissions: user.permissions | TIER_PERMISSIONS)
    end
  end

  def down
    User.where("permissions && ARRAY[?]::varchar[]", TIER_PERMISSIONS).find_each do |user|
      user.update_columns(permissions: user.permissions - TIER_PERMISSIONS)
    end
  end
end
