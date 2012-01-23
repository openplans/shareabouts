class Region < ActiveRecord::Base
  
  belongs_to :shapefile, :inverse_of => :regions
  
  validates :shapefile, :presence => true
  validates :the_geom, :presence => true
  
  serialize :metadata
  
  def display_name
    "#{kind} - #{name}"
  end
  
  def kind
    shapefile.kind
  end
  
  def name
    metadata[shapefile.name_field]
  end
  
end
