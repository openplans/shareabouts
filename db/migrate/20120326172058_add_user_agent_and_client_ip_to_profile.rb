class AddUserAgentAndClientIpToProfile < ActiveRecord::Migration
  def change
    add_column :profiles, :user_agent, :string
    add_column :profiles, :client_ip, :string
    add_index :profiles, [:user_agent, :client_ip]
  end
end
