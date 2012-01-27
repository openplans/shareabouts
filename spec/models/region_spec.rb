require 'spec_helper'

describe Region do
  describe "validations" do
    describe "the_geom" do
      context "when absent" do
        attr_accessor :region
        
        before do
          @region = new_region :the_geom => nil
        end
        
        it "is invalid" do
          @region.should_not be_valid
        end
        
        it "has errors on the_geom" do
          @region.valid?
          @region.errors[:the_geom].should be_present
        end
      end
    end
  end
end
