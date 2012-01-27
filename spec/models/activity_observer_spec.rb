require 'spec_helper'

describe ActivityObserver do
  attr_reader :observer, :feature_point

  before(:all) do
    create_regions
  end

  before do
    @feature_point = make_point_in_region(Region.first)
    @observer      = ActivityObserver.instance
  end
  
  describe "observed callbacks" do
    describe "#after_create" do

      context "when 'observed' is FeaturePoint" do
        def observed                    
          @observed = feature_point
        end

        it "is observed" do
          observed.save!
          observed.activity_items.count.should == 1
        end
      end

      context "when 'observed' is Vote" do
        def observed
          feature_point.save
          @observed = create_vote :supportable => feature_point
        end

        it "is observed" do
          observed.activity_items.count.should == 1          
        end
      end

      context "when 'observed' is Comment" do
        def observed
          feature_point.save
          @observed = create_comment :commentable => feature_point
        end

        it "is observed" do
          observed.activity_items.count.should == 1
        end
      end
    end
  end
end