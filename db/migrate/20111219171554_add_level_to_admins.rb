class AddLevelToAdmins < ActiveRecord::Migration
  def change
    add_column :admins, :level, :integer
  end
end
