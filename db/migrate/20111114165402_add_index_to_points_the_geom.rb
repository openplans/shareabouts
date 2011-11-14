class AddIndexToPointsTheGeom < ActiveRecord::Migration
  def change
    add_index :feature_points, :the_geom, :spacial => true
  end
end
