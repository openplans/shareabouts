class FeaturePolygonsController < ApplicationController

  def index
    respond_to do |format|
      format.json do
        @feature_polygons = FeaturePolygon.visible
        render :json => @feature_polygons.map(&:as_json)
      end
    end
  end
  
end
