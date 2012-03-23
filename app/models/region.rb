# Regions are created in the Admin interface by uploading a Shapefile. Regions 
# are used for classifying map features, by, for example, neighborhood or 
# state. FeatureRegions associates map features with Regions. 

class Region < ActiveRecord::Base
  
  has_many   :feature_regions
  has_many   :feature_points, :through => :feature_regions, :source => :feature, :source_type => 'FeaturePoint'
  belongs_to :shapefile, :inverse_of => :regions
  
  validates :shapefile, :presence => true
  validates :the_geom, :presence => true
  
  serialize :metadata
  
  after_create :add_feature_points_to_region
  
  def display_name
    "#{kind} - #{name}"
  end
  
  def kind
    shapefile.kind
  end
  
  def name
    metadata[shapefile.name_field]
  end
  
  def default?
    shapefile.default?
  end
  
  private
  
  def add_feature_points_to_region    
    feature_point_ids = ActiveRecord::Base.connection.execute <<-SQL
      select feature_points.id 
      FROM   feature_points, regions 
      WHERE  regions.id = #{id} 
      AND    ST_CONTAINS(regions.the_geom, feature_points.the_geom)
    SQL
    
    feature_point_ids.each do |row|
      feature_regions.create :feature_id => row["id"].to_i, :feature_type => "FeaturePoint"
    end
  end
  
end
