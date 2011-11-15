class CreateRegions < ActiveRecord::Migration
  def change
    create_table :regions do |t|
      t.string :name, :kind
      t.text   :description
      t.polygon :the_geom, :srid => 4326 
      t.timestamps
    end
    
    add_index  :regions, :the_geom, :spatial => true
  end
end
