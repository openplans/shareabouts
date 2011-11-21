class FeaturePoint < ActiveRecord::Base
  
  has_many :votes, :as => :supportable, :dependent => :destroy
  has_many :comments, :as => :commentable, :dependent => :destroy, :inverse_of => :commentable
  has_many :feature_regions, :as => :feature, :dependent => :destroy
  has_many :regions, :through => :feature_regions
  
  belongs_to :user
  
  validates :the_geom,  :presence => true
  
  after_create :add_to_regions
  
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
  
  def add_to_regions
    result = ActiveRecord::Base.connection.execute( "select * from regions where ST_Contains(the_geom, ST_SetSRID(ST_Point(-73.993607,40.719811),4326))")
    result.each do |row|
      feature_regions.create :region_id => row["id"].to_i
    end if result
  end
  
end
