class Shapefile < ActiveRecord::Base
  
  has_many :regions, :inverse_of => :shapefile
  
  validates :kind, :presence => true, :uniqueness => true
  
end
