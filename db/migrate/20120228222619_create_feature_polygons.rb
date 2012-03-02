class CreateFeaturePolygons < ActiveRecord::Migration
  def change
    create_table :feature_polygons do |t|
      t.string :name, :submitter_name
      t.text :description
      t.integer :user_id
      t.boolean :visible
      t.multi_polygon :the_geom,  :limit => nil, :srid => 4326      
      t.timestamps
    end
    
    change_table :feature_polygons do |t|
      t.has_attached_file :shapefile
    end

    add_index "feature_polygons", ["the_geom"], :name => "index_feature_polygons_on_the_geom", :spatial => true
  end
end
