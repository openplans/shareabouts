class ChangeRegionsTheGeomToMultipolygon < ActiveRecord::Migration
  def up
    remove_column :regions, :the_geom
    execute "SELECT AddGeometryColumn('regions','the_geom','4326','MULTIPOLYGON',2);"
    add_index :regions, :the_geom, :spatial => true
  end

  def down
    remove_column :regions, :the_geom
    add_column :regions, :the_geom, :polygon, :srid => 4326
    add_index :regions, :the_geom, :spatial => true
  end
end
