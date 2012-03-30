# A FeaturePolygon is a multipolygon that can be displayed on the map. 
# Currently, the creation of FeaturePolygons is an admin-only function, via
# uploading a shapefile. The display of FeaturePolygons is currently not 
# implemented, although FeaturePolygonsController provides JSON that can be
# used to create the polygons on the map.

class FeaturePolygon < ActiveRecord::Base
  include Workflow

  scope :visible, where(:visible => true)
  
  belongs_to :profile
  has_one    :user, :through => :profile
  
  has_attached_file :shapefile # zip file
  validates_attachment_content_type :shapefile, :content_type => "application/zip", :if => :attachment_present?
  validates_with ShapefileContentValidator, :if => :attachment_present?
  
  after_create :enqueue_importer
  
  workflow do
    state :unprocessed do
      event :import, :transitions_to => :importing
    end
    state :importing do
      event :complete, :transitions_to => :complete
      event :error, :transitions_to => :import_error
    end
    state :complete
    state :import_error
  end
  
  def as_json
    { :id => id, :latlngs => the_geom.to_coordinates }
  end
  
  def attachment
    shapefile
  end
  
  # Creates the_geom from a 2D array of latlongs 
  # assumes this is actually not a multipolygon, but a polygon
  def the_geom_from_points=(coordinate_pairs)
    points = coordinate_pairs.map do |coordinates|
      Point.from_x_y( coordinates[0], coordinates[1], 4326 )
    end

    write_attribute :the_geom, MultiPolygon.from_polygons( [ Polygon.from_points([points]) ] )
  end
  
  private
  
  def attachment_present?
    shapefile.present?
  end
  
  def enqueue_importer
    Delayed::Job.enqueue FeaturePolygonJob.new(shapefile.path, id)
  end
end