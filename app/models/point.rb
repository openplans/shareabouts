class Point < ActiveRecord::Base
  
  has_many :votes, :as => :supportable, :dependent => :destroy
  
  # merges top-level lat & lng into point object
  def self.new_from_params(params)
    if params[:point]
      params[:point][:lat] = params[:lat] if params[:lat] 
      params[:point][:lng] = params[:lng] if params[:lng] 
      new params[:point]
    else
      new params
    end
  end

  def votes_count
    votes.count
  end
  
  def lat
    @lat ||= the_geom.try(:lat)
  end
  
  def lng
    @lng ||= the_geom.try(:lon)
  end
  
  def as_geo_json
    {
      :type => "Feature", 
      :geometry => {
        :type => "Point", 
        :coordinates => [lng, lat]
      },
      :properties => {
        :id             => id,
        :name           => name,
        :description    => description
      }
    }
  end
  
  private

  def the_geom_to_s
    raise "set lat and lng first" unless lat.present? && lng.present?
    "SRID=4326;POINT(#{lng} #{lat})"
  end
  
end
