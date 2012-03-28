# Marker attributes for location types whose features should be represented by 
# location type's icon on the map

class Marker < ActiveRecord::Base
  belongs_to :location_type, :inverse_of => :marker
  
  validates :location_type, :presence => true
  
  # Width of the icon image in pixels
  validates :icon_width, :presence => true

  # Height of the icon image in pixels
  validates :icon_height, :presence => true
  
  # The coordinates of the "tip" of the icon (relative to its top left corner). 
  # The icon will be aligned so that this point is at the marker's geographical location.
  validates :icon_anchor_x, :presence => true
  validates :icon_anchor_y, :presence => true
  
  # The point from which the marker popup opens, relative to the anchor point.
  validates :popup_anchor_x, :presence => true
  validates :popup_anchor_y, :presence => true
  
end
