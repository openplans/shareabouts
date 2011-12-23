class LocationType < ActiveRecord::Base
  validates :name, :presence => true
end
