class AddGitProviderToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :git_provider, :string, default: "github"
    add_column :users, :git_instance_url, :string
  end
end
