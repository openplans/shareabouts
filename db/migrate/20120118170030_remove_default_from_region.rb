class RemoveDefaultFromRegion < ActiveRecord::Migration
  def up
    remove_column :regions, :default
  end

  def down
    add_column :regions, :default, :boolean
  end
end
