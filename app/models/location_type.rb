class LocationType < ActiveRecord::Base
  validates :name, :presence => true
  
  has_many :feature_location_types, :dependent => :destroy
  
  has_attached_file :image, :styles => { :small => "32x32>", :icon => "16x16>" }
  
  def features
    feature_location_types.map &:feature
  end
end
