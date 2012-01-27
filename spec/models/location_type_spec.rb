require 'spec_helper'

describe LocationType do
  describe "associations" do
    attr_reader :location_type
    
    before do
      @location_type = create_location_type
    end
    
    context "features" do
      attr_reader :feature
      
      before do
        @feature = create_feature_point
        create_feature_location_type :location_type => location_type, :feature => feature
      end
      
      it "has_many" do
        location_type.features.should include(feature)
      end
    end
  end
  
  describe "validations" do
    context "with no name" do
      attr_reader :location_type
      
      before do
        @location_type = new_location_type :name => nil
        location_type.valid?
      end
      
      it "is invalid" do
        @location_type.should_not be_valid
      end
      
      it "has errors on name" do
        @location_type.errors[:name].should be
      end
    end
  end
end
