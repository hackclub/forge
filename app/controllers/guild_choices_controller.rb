class GuildChoicesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_guilds_enabled!

  GUILD_THEMES = {
    "rivendell" => {
      tagline: "Refuge of the Elves",
      icon: "park"
    },
    "erebor" => {
      tagline: "The Lonely Mountain",
      icon: "construction"
    },
    "edoras" => {
      tagline: "Land of the horselords",
      icon: "bolt"
    },
    "valinor" => {
      tagline: "The Undying Lands",
      icon: "auto_awesome"
    }
  }.freeze

  def new
    return redirect_to(home_path) if current_user.joined_guild?

    render inertia: "GuildChoices/New", props: {
      guilds: User.guilds.keys.map { |g| { name: g, **GUILD_THEMES.fetch(g) } }
    }
  end

  def create
    return redirect_to(home_path, alert: "You're already in a guild.") if current_user.joined_guild?

    guild = params[:guild].to_s.presence
    unless User.guilds.key?(guild)
      redirect_to new_guild_choice_path, alert: "Pick one of the four guilds."
      return
    end

    current_user.update!(guild: guild)
    audit!("user.guild_chosen", target: current_user, metadata: { guild: guild })
    redirect_to home_path, notice: "Welcome to #{guild.titleize}."
  end
end
