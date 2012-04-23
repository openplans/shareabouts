class Profile < ActiveRecord::Base
  
  belongs_to :user, :dependent => :destroy
  has_many :activity_items, :dependent => :destroy
  has_many :comments, :dependent => :destroy
  has_many :feature_points, :dependent => :destroy
  has_many :feature_polygons, :dependent => :destroy
  has_many :votes, :dependent => :destroy
  
  validates :user_agent, :uniqueness => { :scope => :client_ip }, :allow_blank => true
  validates :user_id, :uniqueness => true, :allow_blank => true
  
  def self.find_by_request_fingerprint(request)    
    where(request_fingerprint request).first
  end
  
  def self.create_by_request_fingerprint(request)
    create(request_fingerprint request)
  end
  
  private
  
  def self.request_fingerprint(request)
    { 
      :user_agent => request.env['HTTP_USER_AGENT'], 
      :client_ip  => request.remote_ip, 
      :user_id    => nil
    }
  end
  
end
