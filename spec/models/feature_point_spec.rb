require 'spec_helper'

describe FeaturePoint do
  
  describe "validations" do
    describe "the_geom" do
      context "when absent" do
        attr_accessor :point
        
        before do
          @point = new_feature_point :the_geom => nil
        end
        
        it "is invalid" do
          @point.should_not be_valid
        end
      end
    end
  end
  
  describe "associations" do
    attr_accessor :point
    
    before do
      pending "spatial_adapter not working in specs"
      
      @point = create_feature_point
    end
    
    context "user" do
      attr_accessor :user
      
      before do
        @user = create_user
        @point.update_attibute :user_id, user.id
      end
      
      it "belongs_to" do
        point.user.should == user
      end
    end
    
    context "votes" do
      attr_accessor :vote
      
      before do
        @vote = create_vote :supportable => point
      end
      
      it "has_many" do
        point.votes.should include(vote)
      end
    end
    
    context "comments" do
      attr_accessor :comment
      
      before do
        @comment = create_vote :commentable => point
      end
      
      it "has_many" do
        point.comments.should include(comment)
      end
    end
  end
  
  # instance methods
  describe "a point" do
    attr_accessor :point
    
    before do
      pending "spatial_adapter not working in specs"
      
      @point = create_feature_point
    end
    
    context "with the_geom" do
      before do
        @point.the_geom.should be
      end
      
      it "has an x" do
        @point.x.should be
      end
      
      it "has a y" do
        @point.y.should be
      end
    end
    
    context "that falls within a region" do
      attr_accessor :region, :feature_point
      
      before do
        pending "spatial_adapter not working in specs"
        
        @region = create_region
      end
      
      context "after create" do
        
        before do
          @feature_point.create_feature_point
        end
        
        it "is associated with that region" do
          @feature_point.regions.should include(region)
        end
      end
    end
  end
  
  describe "after initialization" do
    context "regardless of the set visibility" do
      it "is visible" do
        feature_point = FeaturePoint.new
        feature_point.should be_visible
      end
    end
  end
end
