require 'spec_helper'

describe ActivityObserver do
  attr_reader :observer

  before do
    @observer = ActivityObserver.instance
  end
  
  describe "observed callbacks" do
    describe "#after_create" do

      context "when 'observed' is FeaturePoint" do
        def observed
          @observed ||= new_feature_point
        end

        it "is observed" do
          observed.save!
          observed.activity_items.count.should == 1
        end
      end

      context "when 'observed' is Vote" do
        def observed
          @observed ||= new_vote
        end

        it "is observed" do
          observed.save!
          observed.activity_items.count.should == 1
          
        end
      end

      context "when 'observed' is Comment" do
        def observed
          @observed ||= new_comment
        end

        it "is observed" do
          observed.save!
          observed.activity_items.count.should == 1
          
        end
      end
    end
  end
end