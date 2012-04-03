# FeaturePoint represents a point that is displayed on the map.
# If there are any Regions, which are created by an Admin uploading a 
# shapefile, points must fall within at least one of those regions to be valid.
# FeaturePoints can be marked as being not visible in the admin section.
# When a FeaturePoint is marked as not visible, its associated activity items
# are deleted.

class FeaturePoint < ActiveRecord::Base

  class InRegionValidator < ActiveModel::Validator
    def validate(record)
      record.find_regions[0]
    rescue IndexError
      record.errors[:the_geom] << I18n.t("feature.notice.out_of_bounds")
    end
  end

  attr_accessor :found_regions

  scope :visible, where(:visible => true)

  has_many :votes, :as => :supportable, :dependent => :destroy
  has_many :comments, :as => :commentable, :dependent => :destroy, :inverse_of => :commentable
  has_many :feature_regions, :as => :feature, :dependent => :destroy
  has_many :regions, :through => :feature_regions
  has_many :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  has_many :children_activity_items, :as => :subject_parent, :class_name => "ActivityItem", :dependent => :destroy
  belongs_to :profile
  has_one :user, :through => :profile
  has_one :feature_location_type, :as => :feature, :dependent => :destroy, :inverse_of => :feature
  has_one :location_type, :through => :feature_location_type
  has_one :marker, :through => :location_type
  
  before_create :find_regions
  after_create :add_to_regions
  after_create :create_vote
  after_initialize :set_defaults
  after_update :maybe_remove_activity_items

  accepts_nested_attributes_for :feature_location_type

  validates :the_geom,  :presence => true
  validates_with InRegionValidator, :if => lambda { Region.any? }

  # Returns points which are visible within the boundaries
  def self.visible_within(corners)
    visible.where( ["ST_Contains(ST_GeomFromText('POLYGON((? ?,? ?,? ?,? ?,? ?))',4326), feature_points.the_geom)",
      corners[0][0], corners[0][1], corners[1][0], corners[0][1], corners[1][0], corners[1][1], corners[0][0], corners[1][1], corners[0][0], corners[0][1]]
    )
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
    "(#{sprintf('%.6f', latitude)}, #{sprintf('%.6f', longitude)})"
  end

  def display_submitter
    profile.try(:name) || (submitter_name.present? ? submitter_name : User.model_name.human.capitalize)
  end
  
  def region
    regions.find(&:default?) || regions.first
  end
  
  def support_count
    votes.count
  end
  
  def as_json
    attrs = { :id => id, :lat => latitude, :lon => longitude, :pop => support_count }
    attrs[:location_type] = location_type.name.parameterize.underscore if marker.present?
    attrs
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
        :description    => description,
        :location_type  => location_type
      }
    }
  end

  def find_regions
    return [] unless latitude && longitude
    @found_regions ||= ActiveRecord::Base.connection.execute( "select * from regions where ST_Contains(the_geom, ST_SetSRID(ST_Point(#{longitude.to_f},#{latitude.to_f}),4326))")
  end

  def add_to_regions
    found_regions.each do |row|
      feature_regions.create :region_id => row["id"].to_i
    end
  end

  private
  
  def create_vote
    votes.create :profile => profile
  end

  def set_defaults
    return unless new_record?
    self.visible = true
  end
  
  def maybe_remove_activity_items
    return if self.visible?
    
    self.activity_items.delete_all
    self.children_activity_items.delete_all
  end
end
