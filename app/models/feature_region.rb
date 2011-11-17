class FeatureRegion < ActiveRecord::Base

  belongs_to :feature, :polymorphic => true
  belongs_to :region 
  
end
