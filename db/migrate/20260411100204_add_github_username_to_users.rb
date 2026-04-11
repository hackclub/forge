class AddGithubUsernameToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :github_username, :string
  end
end
