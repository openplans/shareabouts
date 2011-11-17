class Region < ActiveRecord::Base

  validates :kind, :presence => true
  validates :name, :presence => true
  validates :the_geom, :presence => true
  
  def display_name
    "#{kind} - #{name}"
  end
end
