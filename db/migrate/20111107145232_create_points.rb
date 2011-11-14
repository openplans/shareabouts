class CreatePoints < ActiveRecord::Migration
  
  def change
    create_table :points do |t|
      t.string :name
      t.text   :description
      t.timestamps
    end
    
    add_column :points, :the_geom, :point, :srid => 4326    
    # add_index  :points, :the_geom, :spatial => true
  end
end
