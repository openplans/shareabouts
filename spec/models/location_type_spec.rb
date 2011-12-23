require 'spec_helper'

describe LocationType do
  describe "validations" do
    context "with no name" do
      attr_accessor :location_type
      
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
