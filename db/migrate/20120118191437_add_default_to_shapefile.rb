class AddDefaultToShapefile < ActiveRecord::Migration
  def change
    add_column :shapefiles, :default, :boolean
  end
end
