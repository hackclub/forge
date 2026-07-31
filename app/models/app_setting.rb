# == Schema Information
#
# Table name: app_settings
#
#  id         :bigint           not null, primary key
#  key        :string           not null
#  value      :text
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_app_settings_on_key  (key) UNIQUE
#
class AppSetting < ApplicationRecord
  encrypts :value

  validates :key, presence: true, uniqueness: true

  def self.get(key)
    find_by(key: key.to_s)&.value
  end

  def self.set(key, value)
    setting = find_or_initialize_by(key: key.to_s)
    setting.update!(value: value)
    setting
  end

  def self.clear(key)
    find_by(key: key.to_s)&.destroy
  end

  def self.updated_at_for(key)
    find_by(key: key.to_s)&.updated_at
  end
end
