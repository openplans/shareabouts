class FeaturePoint < ActiveRecord::Base
  
  has_many :votes, :as => :supportable, :dependent => :destroy
  has_many :comments, :as => :commentable, :dependent => :destroy, :inverse_of => :commentable
  
  validates :the_geom,  :presence => true
  
  accepts_nested_attributes_for :comments

  def votes_count
    votes.count
  end
  
  def latitude
    return the_geom.y if the_geom
  end

  def longitude
    return the_geom.x if the_geom
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
  
end
