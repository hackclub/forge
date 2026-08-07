class RelightStats
  GOAL_HOURS = 15_000.0
  START_AT = Time.utc(2026, 8, 7)
  END_AT = Time.utc(2026, 11, 7)
  CACHE_KEY = "relight/shared/v1".freeze
  CACHE_TTL = 1.minute
  FEED_LIMIT = 12

  MILESTONES = [
    { threshold: 0, name: "Cold Coals" },
    { threshold: 1_000, name: "First Embers" },
    { threshold: 2_500, name: "Kindling Catches" },
    { threshold: 5_000, name: "Flames Rise" },
    { threshold: 10_000, name: "Roaring Blaze" },
    { threshold: 15_000, name: "Forge Relit" }
  ].freeze

  GUILD_THEMES = {
    "rivendell" => { tagline: "Refuge of the Elves", icon: "park" },
    "erebor"    => { tagline: "The Lonely Mountain", icon: "construction" },
    "edoras"    => { tagline: "Land of the horselords", icon: "bolt" },
    "valinor"   => { tagline: "The Undying Lands", icon: "auto_awesome" }
  }.freeze

  def self.shared_props
    Rails.cache.fetch(CACHE_KEY, expires_in: CACHE_TTL) { new.shared_props }
  end

  def self.personal_hours(user)
    Devlog.unscope(:order)
      .where(user_id: user.id, created_at: START_AT..END_AT)
      .sum(:time_hours).to_f.round(1)
  end

  def shared_props
    total = total_hours
    {
      percent: (total / GOAL_HOURS * 100).clamp(0, 100).round(2),
      starts_at: START_AT.iso8601,
      ends_at: END_AT.iso8601,
      days_remaining: days_remaining,
      milestones: milestones(total),
      ember_feed: ember_feed,
      guild_race: guild_race
    }
  end

  private

  def window
    START_AT..END_AT
  end

  def visible_devlogs
    Devlog.unscope(:order)
      .joins(:project)
      .merge(Project.kept.where(hidden: false).not_shadow_banned)
  end

  def total_hours
    visible_devlogs.where(devlogs: { created_at: window }).sum(:time_hours).to_f
  end

  def days_remaining
    [ ((END_AT - Time.current) / 1.day).ceil, 0 ].max
  end

  def milestones(total)
    MILESTONES.map { |m|
      { name: m[:name], reached: total >= m[:threshold] }
    }
  end

  def ember_feed
    visible_devlogs
      .joins(:user)
      .where(devlogs: { created_at: window })
      .includes(:user, :project)
      .reorder(created_at: :desc)
      .limit(FEED_LIMIT)
      .map { |d|
        {
          id: d.id,
          created_at: d.created_at.iso8601,
          user: { id: d.user.id, display_name: d.user.display_name, avatar: d.user.avatar },
          project: { id: d.project.id, name: d.project.name }
        }
      }
  end

  def guild_race
    totals = visible_devlogs
      .joins(:user)
      .where(devlogs: { created_at: 7.days.ago..Time.current })
      .where.not(users: { guild: nil })
      .group("users.guild")
      .sum(:time_hours)

    week_total = totals.values.sum.to_f
    User.guilds.keys.map { |g|
      hours = (totals[g] || 0).to_f
      theme = GUILD_THEMES.fetch(g)
      {
        name: g,
        tagline: theme[:tagline],
        icon: theme[:icon],
        hours: hours.round(1),
        share: week_total.positive? ? (hours / week_total * 100).round(1) : 0.0
      }
    }.sort_by { |r| -r[:hours] }
  end
end
