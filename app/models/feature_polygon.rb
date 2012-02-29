class FeaturePolygon < ActiveRecord::Base
  scope :visible, where(:visible => true)
  
  has_attached_file :shapefile # zip file
  
  
  # Creates the_geom from a 2D array of latlongs 
  # assumes this is actually not a multipolygon, but a polygon
  def the_geom_from_points=(coordinate_pairs)
    points = coordinate_pairs.map do |coordinates|
      Point.from_x_y( coordinates[0], coordinates[1], 4326 )
    end

    write_attribute :the_geom, MultiPolygon.from_polygons( [ Polygon.from_points([points]) ] )
  end  
end