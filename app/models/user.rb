class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  # devise :database_authenticatable, :registerable,
  #        :recoverable, :rememberable, :trackable, :validatable,
  devise :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me
  
  def self.find_for_facebook_oauth(access_token, signed_in_resource=nil)
    data = access_token['extra']['raw_info']
    # data: <Hashie::Mash email="juliamae@gmail.com" first_name="Julia" gender="female" id="24403229" last_name="West" link="http://www.facebook.com/juliamae" locale="en_GB" name="Julia West" timezone=-5 updated_time="2011-10-19T21:14:59+0000" username="juliamae" verified=true>
    
    if user = User.find_by_email(data["email"])
      user
    else # Create a user with a stub password. 
      user = User.create!(:email => data["email"]) 
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
  
end
