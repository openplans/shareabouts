# SiteOptions provide a way for an Admin user to adjust some site settings.
# The default site options that are used in the app are listed in the Names
# constant. Most of the options relate to initial map state. Create these
# options by running rake db:seed and then add values for them at 
# /admin/site_option.

class SiteOption < ActiveRecord::Base

  Names = %w{google_analytics_code map_bounds_p1_lat map_bounds_p1_long map_bounds_p2_lat map_bounds_p2_long map_center_lat map_center_long map_initial_zoom map_max_zoom map_min_zoom}
  
  validates :option_name, :presence => true, :uniqueness => true
  
  def self.[](name)
    find_by_option_name name
  end
  
  # Returns true if a value is set for all the bounds options
  def self.bounds?
    self["map_bounds_p1_lat"].try(:value).present? &&
    self["map_bounds_p1_long"].try(:value).present? &&
    self["map_bounds_p2_lat"].try(:value).present? &&
    self["map_bounds_p2_long"].try(:value).present? 
  end
  
  # True if a value is set for lat and long of map center
  def self.center?
    self["map_center_lat"].try(:value).present? &&
    self["map_center_long"].try(:value).present?
  end
  
  def value
    option_value
  end
end
