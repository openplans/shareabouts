class ChangeRegionAddDefault < ActiveRecord::Migration
  def up
    add_column :regions, :default, :boolean
  end

  def down
    remove_column :regions, :default
  end
end
