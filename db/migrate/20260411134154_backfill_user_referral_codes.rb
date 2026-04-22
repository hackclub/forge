class BackfillUserReferralCodes < ActiveRecord::Migration[8.1]
  class MigrationUser < ActiveRecord::Base
    self.table_name = "users"
  end

  def up
    MigrationUser.where(referral_code: nil).find_each do |user|
      loop do
        candidate = SecureRandom.alphanumeric(8).upcase
        unless MigrationUser.exists?(referral_code: candidate)
          user.update_columns(referral_code: candidate)
          break
        end
      end
    end
  end

  def down
    # no-op
  end
end
