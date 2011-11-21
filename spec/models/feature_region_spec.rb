require 'spec_helper'

describe FeatureRegion do
  describe "associations" do
    attr_accessor :feature_region
    
    describe "feature" do
      attr_accessor :point
      
      before do
        pending "spatial_adapter not working in specs"

        @point = create_feature_point
        @feature_region = create_feature_region :feature => point
      end
      
      it "belongs_to" do
        @feature_region.feature.should == point
      end
    end
    
    describe "region" do
      attr_accessor :region
      
      before do
        pending "spatial_adapter not working in specs"

        @region = create_region
        @feature_region = create_feature_region :region => region
      end
      it "belongs_to" do
        @feature_region.region.should == region
      end
    end
  end
end