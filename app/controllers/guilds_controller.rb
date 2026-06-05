class GuildsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_guilds_enabled!

  THEMES = {
    "rivendell" => { tagline: "The river clan", icon: "park" },
    "erebor"    => { tagline: "Deep in the mines of forge", icon: "construction" },
    "edoras"    => { tagline: "High up in the sky", icon: "bolt" },
    "valinor"   => { tagline: "The Undying Lands", icon: "auto_awesome" }
  }.freeze

  RECENT_ACTIVITY_LIMIT = 12

  def index
    states = GuildState.all.index_by(&:guild)
    member_counts = User.kept.where.not(guild: nil).group(:guild).count

    my_guild = current_user.guild
    my_state = my_guild ? states[my_guild] : nil

    recent_activity = []
    if my_guild
      recent_activity = Devlog
        .joins(project: :user)
        .merge(Project.kept.where(hidden: false).not_shadow_banned)
        .merge(User.in_guild(my_guild))
        .includes(project: :user)
        .order(created_at: :desc)
        .limit(RECENT_ACTIVITY_LIMIT)
        .map { |d| serialize_activity(d) }
    end

    render inertia: "Guilds/Index", props: {
      mine: my_guild,
      referral_code: current_user.referral_code,
      referral_url: referral_url_for(current_user),
      my_guild_detail: my_guild ? guild_detail(my_guild, my_state, member_counts[my_guild] || 0) : nil,
      recent_activity: recent_activity,
      guilds: User.guilds.keys.map { |g| guild_summary(g, states[g], member_counts[g] || 0) }
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

    render inertia: "Guilds/Show", props: {
      guild: guild_detail(name, state, member_count),
      mine: current_user.guild == name,
      member_count: member_count,
      members: members.map { |u| { id: u.id, display_name: u.display_name, avatar: u.avatar } },
      top_referrers: top_referrers
    }
  end

  def leaderboard
    states = GuildState.all.index_by(&:guild)
    member_counts = User.kept.where.not(guild: nil).group(:guild).count

    referrals_total = Referral.approved.joins(:referrer).where.not(users: { guild: nil }).group("users.guild").count

    rows = User.guilds.keys.map { |g|
      state = states[g]
      theme = THEMES.fetch(g)
      {
        name: g,
        tagline: theme[:tagline],
        icon: theme[:icon],
        member_count: member_counts[g] || 0,
        multiplier: state&.multiplier&.to_f || 1.0,
        members_active_week: state&.members_active_week || 0,
        referrals_week: state&.referrals_week || 0,
        prize_pool_coins: state&.prize_pool_coins.to_f,
        referrals_total: referrals_total[User.guilds[g]] || 0,
        computed_at: state&.computed_at&.strftime("%b %d, %Y")
      }
    }

    render inertia: "Guilds/Leaderboard", props: {
      mine: current_user.guild,
      rows: rows
    }
  end

  private

  def guild_summary(name, state, member_count)
    theme = THEMES.fetch(name)
    {
      name: name,
      tagline: theme[:tagline],
      icon: theme[:icon],
      member_count: member_count,
      multiplier: state&.multiplier&.to_f || 1.0,
      prize_pool_coins: state&.prize_pool_coins.to_f,
      computed_at: state&.computed_at&.strftime("%b %d, %Y")
    }
  end

  def guild_detail(name, state, member_count)
    theme = THEMES.fetch(name)
    {
      name: name,
      tagline: theme[:tagline],
      icon: theme[:icon],
      multiplier: state&.multiplier&.to_f || 1.0,
      member_count: member_count,
      members_active_week: state&.members_active_week || 0,
      referrals_week: state&.referrals_week || 0,
      prize_pool_coins: state&.prize_pool_coins.to_f,
      computed_at: state&.computed_at&.strftime("%b %d, %Y at %H:%M")
    }
  end

  def serialize_activity(devlog)
    project = devlog.project
    user = project.user
    {
      id: devlog.id,
      title: devlog.title.presence || "Untitled devlog",
      status: devlog.status,
      time_spent: devlog.time_spent,
      created_at: devlog.created_at.strftime("%b %d"),
      user: { id: user.id, display_name: user.display_name, avatar: user.avatar },
      project: { id: project.id, name: project.name }
    }
  end

  def referral_url_for(user)
    base = ENV.fetch("APP_URL", request.base_url)
    "#{base}/auth/hca/start?ref=#{user.referral_code}"
  end
end
