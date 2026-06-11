# Computes per-member coin shares for group projects.
#
# Hours are attributed by devlog authorship; when a reviewer override is set,
# each member's hours are scaled proportionally (override / devlog total).
# Each member's coins use their OWN streak and guild multipliers, so the
# project total is defined as the sum of the individually-rounded shares —
# there is no rounding remainder to distribute.
class ProjectPayoutCalculator
  Share = Struct.new(:user, :hours, :coins, :streak_at_approval, :streak_multiplier, :guild_multiplier, keyword_init: true)

  def initialize(project)
    @project = project
  end

  def shares
    @shares ||= begin
      devlog_total = hours_by_user.values.sum
      scale = if @project.override_hours.present? && devlog_total.positive?
        @project.override_hours.to_f / devlog_total
      else
        1.0
      end

      hours_by_user.filter_map do |user, raw_hours|
        hours = (raw_hours * scale).round(2)
        next if hours.zero?

        streak = user.current_streak
        streak_multiplier = user.streak_multiplier(streak)
        guild_multiplier = GuildState.multiplier_for(user.guild)
        Share.new(
          user: user,
          hours: hours,
          coins: (hours * @project.coin_rate * streak_multiplier * guild_multiplier).round(2),
          streak_at_approval: streak,
          streak_multiplier: streak_multiplier,
          guild_multiplier: guild_multiplier
        )
      end
    end
  end

  def total
    shares.sum(&:coins).round(2)
  end

  private

  def hours_by_user
    @hours_by_user ||= @project.devlogs.includes(:user).group_by(&:user).transform_values do |devlogs|
      devlogs.sum(&:parsed_hours).to_f
    end
  end
end
