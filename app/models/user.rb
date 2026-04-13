# == Schema Information
#
# Table name: users
#
#  id                  :bigint           not null, primary key
#  address_line1       :string
#  address_line2       :string
#  avatar              :string           not null
#  ban_reason          :text
#  birthday            :date
#  city                :string
#  country             :string
#  discarded_at        :datetime
#  display_name        :string           not null
#  email               :string           not null
#  first_name          :string
#  fulfillment_regions :string           default([]), not null, is an Array
#  git_instance_url    :string
#  git_provider        :string           default("github")
#  github_username     :string
#  hca_token           :text
#  is_adult            :boolean          default(FALSE), not null
#  is_banned           :boolean          default(FALSE), not null
#  is_beta_approved    :boolean          default(FALSE), not null
#  last_name           :string
#  permissions         :string           default([]), not null, is an Array
#  phone_number        :string
#  postal_code         :string
#  referral_code       :string
#  region              :string           default("rest_of_world")
#  roles               :string           default([]), not null, is an Array
#  shop_unlocked       :boolean          default(FALSE), not null
#  state               :string
#  timezone            :string           not null
#  verification_status :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  hca_id              :string           not null
#  slack_id            :string           not null
#
# Indexes
#
#  index_users_on_discarded_at   (discarded_at)
#  index_users_on_referral_code  (referral_code) UNIQUE
#
class User < ApplicationRecord
  include Discardable
  include HasRegion
  include PgSearch::Model

  has_paper_trail

  after_commit :bust_cache

  def bust_cache
    Rails.cache.delete("user/#{id}")
  end

  pg_search_scope :search, against: [ :display_name, :email ], using: { tsearch: { prefix: true } }

  has_many :ahoy_visits, class_name: "Ahoy::Visit", dependent: :nullify
  has_many :ahoy_events, class_name: "Ahoy::Event", dependent: :nullify
  has_many :projects, dependent: :destroy
  has_many :ships, through: :projects
  has_many :reviewed_ships, class_name: "Ship", foreign_key: :reviewer_id, dependent: :nullify, inverse_of: :reviewer
  has_many :user_notes, dependent: :destroy
  has_many :kudos, dependent: :destroy
  has_many :authored_kudos, class_name: "Kudo", foreign_key: :author_id, dependent: :destroy, inverse_of: :author
  has_many :audit_events, class_name: "AuditEvent", foreign_key: :actor_id, dependent: :nullify, inverse_of: :actor
  has_many :orders, dependent: :destroy
  has_many :assigned_orders, class_name: "Order", foreign_key: :assigned_to_id, dependent: :nullify, inverse_of: :assigned_to
  has_many :coin_adjustments, dependent: :destroy
  has_many :referrals_made, class_name: "Referral", foreign_key: :referrer_id, dependent: :destroy, inverse_of: :referrer
  has_one :referral_received, class_name: "Referral", foreign_key: :referred_id, dependent: :destroy, inverse_of: :referred
  has_many :activity_days, class_name: "UserActivityDay", dependent: :destroy

  STREAK_MULTIPLIER_TIERS = [
    [ 3,   1.02 ],
    [ 7,   1.05 ],
    [ 14,  1.10 ],
    [ 30,  1.15 ],
    [ 60,  1.20 ],
    [ 100, 1.25 ]
  ].freeze

  def record_activity!(date = Date.current)
    activity_days.find_or_create_by!(active_on: date)
  rescue ActiveRecord::RecordNotUnique
    nil
  end

  def streak_multiplier(streak = current_streak)
    STREAK_MULTIPLIER_TIERS.reverse_each do |threshold, mult|
      return mult if streak >= threshold
    end
    1.0
  end

  def next_streak_milestone(streak = current_streak)
    STREAK_MULTIPLIER_TIERS.map(&:first).find { |d| d > streak }
  end

  def next_streak_multiplier(streak = current_streak)
    pair = STREAK_MULTIPLIER_TIERS.find { |d, _| d > streak }
    pair&.last
  end

  def current_streak(today: Date.current)
    dates = activity_days.where(active_on: (today - 365)..today).order(active_on: :desc).pluck(:active_on).to_set
    return 0 if dates.empty?

    cursor = dates.include?(today) ? today : today - 1
    return 0 unless dates.include?(cursor)

    streak = 0
    while dates.include?(cursor)
      streak += 1
      cursor -= 1
    end
    streak
  end

  def longest_streak
    dates = activity_days.order(:active_on).pluck(:active_on)
    return 0 if dates.empty?

    longest = 1
    run = 1
    dates.each_cons(2) do |a, b|
      run = (b == a + 1) ? run + 1 : 1
      longest = run if run > longest
    end
    longest
  end

  def last_active_on
    activity_days.maximum(:active_on)
  end

  before_validation :ensure_referral_code, on: :create

  encrypts :hca_token

  validates :avatar, :display_name, :email, :timezone, presence: true
  validates :slack_id, presence: true
  validates :hca_id, presence: true
  validates :roles, presence: true
  validates :is_banned, inclusion: { in: [ true, false ] }
  validates :region, inclusion: { in: REGION_KEYS }, allow_nil: true

  def has_role?(role)
    roles.include?(role.to_s)
  end

  def add_role(role)
    roles << role.to_s unless has_role?(role)
    save
  end

  def remove_role(role)
    roles.delete(role.to_s)
    save
  end

  def admin?
    has_role?(:admin)
  end

  def user?
    has_role?(:user)
  end

  def reviewer?
    has_role?(:reviewer)
  end

  def support?
    has_role?(:support)
  end

  def fulfillment?
    has_role?(:fulfillment)
  end

  def staff?
    admin? || reviewer? || support? || fulfillment?
  end

  AVAILABLE_PERMISSIONS = %w[
    pending_reviews
    projects
    users
    ships
    feature_flags
    audit_log
    jobs
    third_party
    support
    hackatime
    news
    orders
    referrals
    superadmin
  ].freeze

  ROLE_DEFAULT_PERMISSIONS = {
    "admin" => AVAILABLE_PERMISSIONS - %w[superadmin],
    "reviewer" => %w[pending_reviews projects ships hackatime],
    "support" => %w[projects users support],
    "fulfillment" => %w[projects ships orders]
  }.freeze

  def has_permission?(perm)
    permissions.include?(perm.to_s)
  end

  def superadmin?
    has_permission?("superadmin")
  end

  def coins_earned
    projects.kept.sum(&:coins_earned)
  end

  def coins_spent
    orders.where(status: %i[pending approved fulfilled]).sum(:coin_cost).to_f
  end

  def coins_adjusted
    coin_adjustments.sum(:amount).to_f
  end

  def coin_balance
    (coins_earned + coins_adjusted - coins_spent).round(2)
  end

  def has_built_project?
    projects.kept.where.not(built_at: nil).exists?
  end

  def can_buy_shop_items?
    (has_attribute?(:shop_unlocked) && shop_unlocked?) || has_built_project?
  end

  def grant_permission(perm)
    self.permissions |= [ perm.to_s ]
  end

  def revoke_permission(perm)
    permissions.delete(perm.to_s)
  end

  def apply_default_permissions_for_role(role)
    defaults = ROLE_DEFAULT_PERMISSIONS[role.to_s]
    return unless defaults

    self.permissions |= defaults
  end

  def self.exchange_hca_token(code, redirect_uri)
    token_data = HcaService.exchange_code_for_token(code, redirect_uri)

    unless token_data
      raise StandardError, "Failed to exchange authorization code for HCA access token"
    end

    access_token = token_data["access_token"]
    unless access_token
      raise StandardError, "No access token in HCA response"
    end

    hca_response = HcaService.me(access_token)
    unless hca_response
      raise StandardError, "Failed to fetch user identity from HCA"
    end

    identity = hca_response["identity"]
    unless identity
      raise StandardError, "No identity data in HCA response"
    end

    if determine_is_adult(identity)
      raise StandardError, "Sorry, Forge is for teen builders (under 19). You're not eligible to participate."
    end

    hca_id = identity["id"]
    email = identity["primary_email"]
    user = User.find_by(hca_id: hca_id)

    if user.present?
      Rails.logger.tagged("UserCreation") do
        Rails.logger.info({
          event: "existing_user_found",
          hca_id: hca_id,
          user_id: user.id
        }.to_json)
      end

      user.update(hca_token: access_token, email: email)
      user.apply_hca_identity(identity)
      user.refresh_profile_from_slack
      return user
    end

    user = create_from_hca(identity, access_token)
    user.apply_hca_identity(identity)
    user.refresh_profile_from_slack
    user
  end

  def apply_hca_identity(identity)
    return if identity.blank?

    addr = identity["address"].is_a?(Hash) ? identity["address"] : identity

    attrs = {
      address_line1: pick(addr, %w[address_line_1 address_line1 line_1 line1 street]).presence,
      address_line2: pick(addr, %w[address_line_2 address_line2 line_2 line2]).presence,
      city: pick(addr, %w[city locality]).presence,
      state: pick(addr, %w[state state_province province region]).presence,
      country: pick(addr, %w[country country_code]).presence,
      postal_code: pick(addr, %w[postal_code zip zip_code postcode]).presence,
      phone_number: pick(identity, %w[phone_number phone]).presence
    }.compact

    update(attrs) if attrs.any?
  end

  def self.create_from_hca(identity, access_token)
    email = identity["primary_email"]
    first_name = identity["first_name"] || ""
    last_name = identity["last_name"] || ""
    display_name = first_name.presence || identity["id"] || "User"
    avatar = identity["profile_picture"].presence || "/static-assets/pfp_fallback.webp"
    timezone = "UTC"
    slack_id = identity["slack_id"] || ""
    verification_status = identity["verification_status"] || ""
    is_adult = determine_is_adult(identity)
    birthday = begin
      Date.parse(identity["birthday"].to_s)
    rescue StandardError
      nil
    end

    if email.blank? || !(email =~ URI::MailTo::EMAIL_REGEXP)
      Rails.logger.warn({
        event: "hca_user_missing_or_invalid_email",
        email: email,
        identity: identity
      }.to_json)
      raise StandardError, "HCA user has an invalid email: #{email.inspect}"
    end

    Rails.logger.tagged("UserCreation") do
      Rails.logger.info({
        event: "hca_user_found",
        email: email,
        display_name: display_name,
        slack_id: slack_id,
        is_adult: is_adult
      }.to_json)
    end

    User.create!(
      email: email,
      display_name: display_name,
      first_name: first_name.presence,
      last_name: last_name.presence,
      birthday: birthday,
      avatar: avatar,
      timezone: timezone,
      slack_id: slack_id,
      verification_status: verification_status,
      hca_token: access_token,
      hca_id: identity["id"],
      is_adult: is_adult,
      is_banned: false,
      roles: [ "user" ]
    )
  end

  def refresh_profile_from_slack
    return if slack_id.blank?

    user_info = User.fetch_slack_user_info(normalized_slack_id)
    return unless user_info

    profile = user_info.user.profile
    return unless profile

    new_display_name = profile.display_name.presence
    new_avatar = profile.image_192.presence ||
      profile.image_512.presence ||
      profile.image_72.presence ||
      profile.image_48.presence ||
      profile.image_32.presence ||
      profile.image_24.presence ||
      profile.image_original
    new_timezone = user_info.user.tz

    updates = {}
    updates[:display_name] = new_display_name if new_display_name.present? && display_name != new_display_name
    if new_avatar.present? && avatar != new_avatar
      updates[:avatar] = new_avatar
    elsif avatar.blank?
      updates[:avatar] = "/static-assets/pfp_fallback.webp"
    end
    updates[:timezone] = new_timezone if new_timezone.present? && timezone != new_timezone

    return if updates.empty?

    Rails.logger.tagged("ProfileRefresh") do
      Rails.logger.info({
        event: "slack_profile_refresh",
        user_id: id,
        slack_id: slack_id,
        updates: updates.keys
      }.to_json)
    end

    update!(updates)
  rescue StandardError => e
    Rails.logger.tagged("ProfileRefresh") do
      Rails.logger.error({
        event: "slack_profile_refresh_failed",
        user_id: id,
        slack_id: slack_id,
        error: e.message
      }.to_json)
    end
  end

  def first_ref
    first_visit = ahoy_visits.order(:started_at).first
    return nil unless first_visit

    visitor_token = first_visit.visitor_token
    earliest_visit_with_ref = Ahoy::Visit.where(visitor_token: visitor_token)
                                          .where.not(utm_source: nil)
                                          .order(:started_at)
                                          .first

    earliest_visit_with_ref&.utm_source
  end

  private

  def pick(hash, keys)
    return "" unless hash.is_a?(Hash)

    keys.each do |k|
      value = hash[k] || hash[k.to_sym]
      return value.to_s if value.present?
    end
    ""
  end

  def ensure_referral_code
    return if referral_code.present?

    loop do
      candidate = SecureRandom.alphanumeric(8).upcase
      unless User.exists?(referral_code: candidate)
        self.referral_code = candidate
        break
      end
    end
  end

  def self.determine_is_adult(identity)
    birthday_str = identity["birthday"]
    return false if birthday_str.blank?

    begin
      birthday = Date.parse(birthday_str)
      age_today = (Date.today - birthday.to_date) / 365.25
      age_today >= 19
    rescue ArgumentError
      false
    end
  end

  def self.fetch_slack_user_info(slack_id)
    return nil if slack_id.blank?

    client = Slack::Web::Client.new(token: ENV.fetch("SLACK_BOT_TOKEN", nil))
    retries = 0

    begin
      client.users_info(user: slack_id)
    rescue Slack::Web::Api::Errors::TooManyRequestsError => e
      if retries < 3
        sleep e.retry_after
        retries += 1
        retry
      end

      Rails.logger.error("Slack API ratelimit, max retries on #{slack_id}.")
      nil
    rescue Slack::Web::Api::Errors::SlackError => e
      Rails.logger.warn("Slack API error for #{slack_id}: #{e.message}")
      nil
    rescue StandardError => e
      Rails.logger.warn("Slack API error for #{slack_id}: #{e.message}")
      nil
    end
  end

  def normalized_slack_id
    return slack_id unless Rails.env.development?

    slack_id.delete_suffix("_DEV")
  end
end
