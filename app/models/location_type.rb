# LocationTypes classify types of locations on the map. They are created in
# the admin section and can optionally have an icon associated with them. 

class LocationType < ActiveRecord::Base
  validates :name, :presence => true
  
  has_many :feature_location_types, :dependent => :destroy
  has_many :feature_points, :through => :feature_location_types, :source => :feature, :source_type => 'FeaturePoint'
  
  has_attached_file :image, :styles => { :small => "32x32>", :icon => "16x16>" }
  
end
