class GuildState < ApplicationRecord
  enum :guild, { rivendell: 0, erebor: 1, edoras: 2, valinor: 3 }

  POOL_PER_REFERRAL = 1.0

  validates :guild, presence: true, uniqueness: true
  validates :multiplier, presence: true

  def self.multiplier_for(name)
    return 1.0 if name.blank?
    return 1.0 unless FeatureFlag.enabled?("guilds")

    find_by(guild: name)&.multiplier&.to_f || 1.0
  end

  def prize_pool_coins
    (referrals_week * POOL_PER_REFERRAL).round(2)
  end
end
