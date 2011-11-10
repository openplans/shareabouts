class Vote < ActiveRecord::Base
  
  belongs_to :supportable, :polymorphic => true
  
  validates :supportable_id, :presence => true
  validates :supportable_type, :presence => true
end
