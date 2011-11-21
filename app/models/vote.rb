class Vote < ActiveRecord::Base
  
  belongs_to :supportable, :polymorphic => true
  belongs_to :user
  
  validates :supportable, :presence => true
end
