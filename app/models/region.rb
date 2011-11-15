class Region < ActiveRecord::Base

  validates :kind, :presence => true
  validates :name, :presence => true
  validates :the_geom, :presence => true
  
end
