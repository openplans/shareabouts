class Vote < ActiveRecord::Base
  
  belongs_to :supportable, :polymorphic => true
  belongs_to :user
  has_many   :activity_items, :as => :subject, :inverse_of => :subject, :dependent => :destroy
  
  validates :supportable, :presence => true
end
