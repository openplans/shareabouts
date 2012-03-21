class Profile < ActiveRecord::Base
  belongs_to :user
  
  validates :user, :presence => true
  validates :user_id, :uniqueness => true
end
