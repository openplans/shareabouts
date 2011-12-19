class SiteOption < ActiveRecord::Base

  Names = %w{google_analytics_code map_bounds_p1_lat map_bounds_p1_long map_bounds_p2_lat map_bounds_p2_long map_initial_zoom map_max_zoom map_min_zoom}
  
  validates :option_name, :presence => true, :uniqueness => true

end
