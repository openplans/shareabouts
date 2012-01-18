class Region < ActiveRecord::Base
  
  belongs_to :shapefile, :inverse_of => :regions
  
  validates :shapefile, :presence => true
  validates :name, :presence => true
  validates :the_geom, :presence => true
  
  def display_name
    "#{kind} - #{name}"
  end
  
  def kind
    shapefile.kind
  end
  
end
