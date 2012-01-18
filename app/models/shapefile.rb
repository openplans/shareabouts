class Shapefile < ActiveRecord::Base
    
  validates :kind, :presence => true
  
end
