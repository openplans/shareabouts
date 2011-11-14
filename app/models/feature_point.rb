class FeaturePoint < ActiveRecord::Base
  
  has_many :votes, :as => :supportable, :dependent => :destroy
  
  validates :the_geom,  :presence => true
  
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
  
  def latitude
    return the_geom.x if the_geom
  end

  def longitude
    return the_geom.yif the_geom
  end
  
  def nearest
    self.class.where("id <> #{id}").select("*, the_geom <-> point '#{the_geom}' as distance").order("distance asc").limit(1).first
  end
  
  def as_geo_json
    {
      :type => "Feature", 
      :geometry => {
        :type => "Point", 
        :coordinates => [longitude, latitude]
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
