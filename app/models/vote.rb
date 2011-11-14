class Vote < ActiveRecord::Base
  
  belongs_to :supportable, :polymorphic => true
  
  validates :supportable, :presence => true
end
