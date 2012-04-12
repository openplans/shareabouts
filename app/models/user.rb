# Represents an authenticated User. We're currently using facebook and twitter
# to authenticate users, so users' passwords are bypassed. The creation of users
# after oauth callbacks happens in User#find_for_twitter_oauth and 
# User#find_for_facebook_oauth.

class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  # devise :database_authenticatable, :registerable,
  #        :recoverable, :rememberable, :trackable, :validatable,
  devise :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email

  has_one :profile  

  has_many :activity_items, :through => :profile
  has_many :feature_points, :through => :profile
  has_many :feature_polygons, :through => :profile
  has_many :votes, :through => :profile
  has_many :comments, :through => :profile

  def self.find_for_twitter_oauth(access_token, signed_in_resource=nil)
    data = access_token['extra']['raw_info']
    
    # Twitter does not give access to email, so possibility for double accounts.
    screenname = "@#{data["screen_name"]}"
        
    if user = User.find_by_email(screenname)
      user
    else # Create a user with a stub password & twitter name for an email address
      user    = User.create!(:email => screenname) 
      profile = user.create_profile :name => data["name"]
      
      user.twitter_id         = data["id"]
      user.encrypted_password = Devise.friendly_token[0,20]
      user.save
      user
    end
  end
  
  def self.find_for_facebook_oauth(access_token, signed_in_resource=nil)
    data = access_token['extra']['raw_info']    
    
    if user = User.find_by_email(data["email"])
      user
    else # Create a user with a stub password. 
      user    = User.create!(:email => data["email"]) 
      profile = user.create_profile :name => data["name"], :email => data["email"]
      
      user.facebook_id        = data["id"]
      user.encrypted_password = Devise.friendly_token[0,20]
      user.save
      user
    end
  end
  
  def self.new_with_session(params, session)
    super.tap do |user|
      if data = session["devise.facebook_data"] && session["devise.facebook_data"]["extra"]["user_hash"]
        user.email = data["email"]
      end
    end
  end
  
  def name
    profile.try(:name) || read_attribute(:name)
  end
  
end
