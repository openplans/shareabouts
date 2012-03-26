# A FeatureRegion joins map features to Regions. Currently, only FeaturePoints 
# can be associated with a Region. FeatureRegions are created: 1- after a new
# FeaturePoint is created, 2- When a new Shapefile is uploaded by an admin.

class FeatureRegion < ActiveRecord::Base

  belongs_to :feature, :polymorphic => true
  belongs_to :region 
  
end
