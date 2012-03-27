# Votes are a simple way for visitors to show support for a map feature. 
# Votes are polymorphic, so they can be applied to any model as long as the 
# other model specifies `has_many :votes, :as => :supportable`

class Vote < ActiveRecord::Base
  
  belongs_to :supportable, :polymorphic => true
  belongs_to :profile
  has_one    :user, :through => :profile
  has_many   :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  
  validates :supportable, :presence => true
  
end
