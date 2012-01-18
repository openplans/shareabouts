class CreateShapefiles < ActiveRecord::Migration
  def up
    create_table :shapefiles do |t|
      t.string :kind
      t.timestamps
    end
    
    change_table :shapefiles do |t|
     t.has_attached_file :data
   end
  end
  
  def down
    remove_table :shapefiles
  end
end
