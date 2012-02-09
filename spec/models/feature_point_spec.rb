require 'spec_helper'

describe FeaturePoint do
  
  describe "validations" do
    describe "the_geom" do
      context "when absent" do
        attr_reader :point
        
        before do
          @point = new_feature_point :the_geom => nil, :nil_the_geom => true
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
    
    context "location_type" do
      attr_reader :location_type
      
      before do
        @location_type = create_location_type
        create_feature_location_type :location_type => location_type, :feature => point
      end
      
      it "has_many" do
        point.location_type.should == location_type
      end
    end
  end
  
  # instance methods
  describe "a point" do
    attr_reader :point
    
    before do
      @point = create_feature_point
    end
    
    context "without supports" do
      before do
        point.votes.should_not be_present
      end
      
      it "has a support_count of 0" do
        point.support_count.should == 0
      end
    end
    
    context "with supports" do
      before do
        create_vote :supportable => point
        point.votes.should be_present
      end
      
      it "has a support_count of 1" do
        point.support_count.should == 1
      end
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
      
      it "displays generic user model name" do
        point.display_submitter.should == User.model_name.human.capitalize
      end
    end
        
    context "that falls within a region" do
      attr_reader :region, :feature_point
      
      before do
        create_regions unless Region.any?
        @region = Region.first
        result = ActiveRecord::Base.connection.execute "select ST_Centroid(the_geom) from regions where id=#{region.id}"
        @feature_point = new_feature_point :the_geom => result.first["st_centroid"]
      end
      
      context "after create" do        
        it "is associated with that region" do
          feature_point.save
          @feature_point.regions.should include(region)
        end
      end
    end
    
    context "after being set to invisible" do
      before do
        point.activity_items.should be_present
        create_vote :supportable => point
        point.reload.children_activity_items.should be_present
        
        point.update_attribute :visible, false          
      end
      
      it "destroys related activity items" do        
        point.reload.children_activity_items.should_not be_present
        point.reload.activity_items.should_not be_present
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
