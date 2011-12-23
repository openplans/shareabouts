require 'spec_helper'

describe FeaturePoint do
  
  describe "validations" do
    describe "the_geom" do
      context "when absent" do
        attr_reader :point
        
        before do
          @point = new_feature_point :the_geom => nil
        end
        
        it "is invalid" do
          point.should_not be_valid
        end
      end
      
      context "when outside of any regions" do
        attr_reader :point
        
        before do
          @point = new_feature_point :the_geom => Point.from_x_y( -74.03291702270508, 40.74374551975831, 4326 ) #new jersey
        end
        
        it "is invalid" do
          point.should_not be_valid
        end
        
        it "errors on base" do
          point.valid?
          point.errors[:the_geom].should include("Point doesn't fall within the defined regions")
        end
      end
    end
  end
  
  describe "associations" do
    attr_reader :point
    
    before do
      make_staten_island
      @point = create_feature_point
    end
    
    context "user" do
      attr_reader :user
      
      before do
        @user = create_user
        @point.update_attribute :user_id, user.id
      end
      
      it "belongs_to" do
        point.user.should == user
      end
    end
    
    context "votes" do
      attr_reader :vote
      
      before do
        @vote = create_vote :supportable => point
      end
      
      it "has_many" do
        point.votes.should include(vote)
      end
    end
    
    context "comments" do
      attr_reader :comment
      
      before do
        @comment = create_comment :commentable => point
      end
      
      it "has_many" do
        point.comments.should include(comment)
      end
    end
    
    context "location_types" do
      attr_reader :location_type
      
      before do
        @location_type = create_location_type
        create_feature_location_type :location_type => location_type, :feature => point
      end
      
      it "has_many" do
        point.location_types.should include(location_type)
      end
    end
  end
  
  # instance methods
  describe "a point" do
    attr_reader :point
    
    before do
      make_staten_island
      @point = create_feature_point
    end
    
    context "with the_geom" do
      before do
        point.the_geom.should be
      end
      
      it "has an latitude" do
        point.latitude.should be
      end
      
      it "has a longitude" do
        point.longitude.should be
      end
      
      it "is displayed pretty" do
        point.display_the_geom.match( /\(-*\d+\.\d+,\s*-*\d+\.\d+\)/ ).should_not be_nil
      end
    end
    
    context "with name" do
      attr_reader :name
      before do 
        point.update_attribute :name, (@name = Faker::Lorem.words)
      end
      
      it "is displayed via the name" do
        point.display_name.should == name
      end
    end
    
    context "without name" do
      before do
        point.name.should_not be
      end
      
      it "is displayed via the geom" do
        point.display_name.should == point.display_the_geom
      end
    end
    
    context "with submitter" do
      attr_reader :user
      
      before do
        point.user = (@user = create_user)
      end
      
      it "displays submitter display name" do
        point.display_submitter.should == point.user.name
      end
    end
    
    context "without submitter" do      
      before do
        point.user.should_not be
      end
      
      it "doesn't display submitter display name" do
        point.display_submitter.should_not be
      end
    end
        
    context "that falls within a region" do
      attr_reader :region, :feature_point
      
      before do        
        @region = make_staten_island
      end
      
      context "after create" do
        
        before do
          @feature_point = create_feature_point
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
