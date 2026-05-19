class AddLapseUrlToDevlogs < ActiveRecord::Migration[8.1]
  def change
    add_column :devlogs, :lapse_url, :string
  end
end
