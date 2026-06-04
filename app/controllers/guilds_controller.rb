class GuildsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_guilds_enabled!

  THEMES = {
    "rivendell" => { tagline: "The river clan", icon: "park" },
    "erebor"    => { tagline: "Deep in the mines of forge", icon: "construction" },
    "edoras"    => { tagline: "High up in the sky", icon: "bolt" },
    "valinor"   => { tagline: "The Undying Lands", icon: "auto_awesome" }
  }.freeze

  def index
    states = GuildState.all.index_by(&:guild)
    member_counts = User.kept.where.not(guild: nil).group(:guild).count

    render inertia: "Guilds/Index", props: {
      mine: current_user.guild,
      guilds: User.guilds.keys.map { |g|
        state = states[g]
        theme = THEMES.fetch(g)
        {
          name: g,
          tagline: theme[:tagline],
          icon: theme[:icon],
          member_count: member_counts[g] || 0,
          multiplier: state&.multiplier&.to_f || 1.0,
          computed_at: state&.computed_at&.strftime("%b %d, %Y")
        }
      }
    }
  end

  def show
    name = params[:id].to_s
    raise ActiveRecord::RecordNotFound unless User.guilds.key?(name)

    state = GuildState.find_by(guild: name)
    members = User.kept.in_guild(name).order(created_at: :desc).limit(100)
    member_count = User.kept.in_guild(name).count

    referrer_counts = Referral.approved.joins(:referrer).merge(User.in_guild(name)).group(:referrer_id).count
    top_referrers = User.where(id: referrer_counts.keys).map { |u|
      { id: u.id, display_name: u.display_name, avatar: u.avatar, referrals: referrer_counts[u.id] }
    }.sort_by { |r| -r[:referrals] }.first(10)

    theme = THEMES.fetch(name)

    render inertia: "Guilds/Show", props: {
      guild: {
        name: name,
        tagline: theme[:tagline],
        icon: theme[:icon],
        multiplier: state&.multiplier&.to_f || 1.0,
        members_active_week: state&.members_active_week || 0,
        referrals_week: state&.referrals_week || 0,
        computed_at: state&.computed_at&.strftime("%b %d, %Y at %H:%M")
      },
      mine: current_user.guild == name,
      member_count: member_count,
      members: members.map { |u| { id: u.id, display_name: u.display_name, avatar: u.avatar } },
      top_referrers: top_referrers
    }
  end
end
