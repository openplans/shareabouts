class Profile < ActiveRecord::Base
  
  belongs_to :user
  has_many :activity_items
  has_many :comments
  has_many :feature_points
  has_many :feature_polygons
  has_many :votes
  
  validates :user_agent, :uniqueness => { :scope => :client_ip }, :allow_blank => true
  validates :user_id, :uniqueness => true, :allow_blank => true
  
end
