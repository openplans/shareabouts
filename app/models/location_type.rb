class LocationType < ActiveRecord::Base
  validates :name, :presence => true
  
  has_many :feature_location_types, :dependent => :destroy
  
  def features
    feature_location_types.map &:feature
  end
end
