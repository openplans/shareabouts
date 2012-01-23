class AddNameFieldToShapefile < ActiveRecord::Migration
  def change
    add_column :shapefiles, :name_field, :string
  end
end
