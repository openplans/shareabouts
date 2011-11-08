class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :set_locale
  
  def geo_json_for(things)
    {
      :type => "FeatureCollection",
      :features => things.map(&:as_geo_json)
    }
  end
  
  def set_locale
    I18n.locale = env['rack.locale'] || I18n.default_locale
  end
end
