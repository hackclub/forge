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
#  hca_token           :text
#  is_adult            :boolean          default(FALSE), not null
#  is_banned           :boolean          default(FALSE), not null
#  is_beta_approved    :boolean          default(FALSE), not null
#  last_name           :string
#  permissions         :string           default([]), not null, is an Array
#  postal_code         :string
#  roles               :string           default([]), not null, is an Array
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
#  index_users_on_discarded_at  (discarded_at)
#
class User < ApplicationRecord
  include Discardable
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
  has_many :authored_kudos, class_name: "Kudo", foreign_key: :author_id, dependent: :nullify, inverse_of: :author

  encrypts :hca_token

  validates :avatar, :display_name, :email, :timezone, presence: true
  validates :slack_id, presence: true
  validates :hca_id, presence: true
  validates :roles, presence: true
  validates :is_banned, inclusion: { in: [ true, false ] }

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
    superadmin
  ].freeze

  ROLE_DEFAULT_PERMISSIONS = {
    "admin" => AVAILABLE_PERMISSIONS - %w[superadmin],
    "reviewer" => %w[pending_reviews projects ships],
    "support" => %w[projects users support],
    "fulfillment" => %w[projects ships]
  }.freeze

  def has_permission?(perm)
    permissions.include?(perm.to_s)
  end

  def superadmin?
    has_permission?("superadmin")
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
      user.refresh_profile_from_slack
      return user
    end

    user = create_from_hca(identity, access_token)
    user.refresh_profile_from_slack
    user
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
