class CreateContractorAgreements < ActiveRecord::Migration[8.1]
  def change
    create_table :contractor_agreements do |t|
      t.references :user, index: { unique: true }, null: false, foreign_key: true
      t.string :contract_version, null: false
      t.string :signed_name, null: false
      t.string :signed_email
      t.string :signed_ip
      t.datetime :signed_at, null: false
      t.datetime :billable_from, null: false
      t.integer :approve_rate_cents, null: false, default: 125
      t.integer :return_rate_cents, null: false, default: 75
      t.integer :reject_rate_cents, null: false, default: 75

      t.timestamps
    end
  end
end
