class BackfillOrphQuestBadges < ActiveRecord::Migration[8.1]
  def up
    approved_status = Project.statuses[:approved]
    qualifying = Project
      .where(discarded_at: nil, status: approved_status)
      .order(Arel.sql("COALESCE(reviewed_at, updated_at) ASC"))
      .limit(Badge::ORPH_QUEST_GOAL)

    qualifying.includes(:user).each do |project|
      user = project.user
      next unless user
      next if Badge.exists?(user_id: user.id, key: Badge::ORPH_QUEST_KEY)

      Badge.create!(
        user_id: user.id,
        key: Badge::ORPH_QUEST_KEY,
        name: "Orph's Motivation",
        description: "Shipped an approved project to help cheer Orph back up before the community reached #{Badge::ORPH_QUEST_GOAL}.",
        icon: "flag",
        color: "orange",
        awarded_at: project.reviewed_at || project.updated_at || Time.current
      )
    end
  end

  def down
    Badge.where(key: Badge::ORPH_QUEST_KEY).destroy_all
  end
end
