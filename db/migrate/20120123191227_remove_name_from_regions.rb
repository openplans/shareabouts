class RemoveNameFromRegions < ActiveRecord::Migration
  def up
    remove_column :regions, :name
  end

  def down
    add_column :regions, :name, :string
  end
end
