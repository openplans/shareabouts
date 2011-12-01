class FeaturePoint < ActiveRecord::Base
  
  class InRegionValidator < ActiveModel::Validator
    def validate(record)
      record.find_regions[0]
    rescue IndexError
      record.errors[:base] << "Point doesn't fall within the defined regions"
    end
  end
  
  attr_accessor :found_regions
  
  scope :visible, where(:visible => true)

  has_many :votes, :as => :supportable, :dependent => :destroy
  has_many :comments, :as => :commentable, :dependent => :destroy, :inverse_of => :commentable
  has_many :feature_regions, :as => :feature
  has_many :regions, :through => :feature_regions  
  belongs_to :user  
  
  before_create :find_regions
  after_create :add_to_regions
  after_initialize :set_defaults
  
  accepts_nested_attributes_for :comments
  
  validates :the_geom,  :presence => true
  validates_with InRegionValidator  

  def votes_count
    votes.count
  end
  
  def latitude
    return the_geom.y if the_geom
  end

  def longitude
    return the_geom.x if the_geom
  end
  
  def display_name
    name.present? ? name : display_the_geom
  end
  
  def display_the_geom
    "(#{sprintf('%.6f', longitude)}, #{sprintf('%.6f', latitude)})"
  end
  
  def display_submitter
    user.email if user.present?
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
  
  def find_regions
    return [] unless latitude && longitude
    @found_regions ||= ActiveRecord::Base.connection.execute( "select * from regions where ST_Contains(the_geom, ST_SetSRID(ST_Point(#{longitude},#{latitude}),4326))")
  end
  
  def add_to_regions
    found_regions.each do |row|
      feature_regions.create :region_id => row["id"].to_i
    end
  end
  
  private
  
  def set_defaults 
    return unless new_record?
    self.visible = true
  end
end
