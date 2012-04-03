require 'spec_helper'

describe FeaturePoint do
  it { should have_many(:votes)}
  it { should have_many(:comments)}
  it { should have_many(:feature_regions)}
  it { should have_many(:regions)}
  it { should have_many(:activity_items)}
  it { should have_many(:children_activity_items)}
  
  it { should have_one(:feature_location_type)}
  it { should have_one(:location_type)}
  it { should have_one(:marker)}
  
  it { should belong_to(:profile)}
  
  
  it { should validate_presence_of(:the_geom) }
  
  describe "validations" do
    describe "the_geom" do      
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
      
      context "when there are no regions" do
        attr_reader :a_point
        before do
          @a_point = create_feature_point
          Region.destroy_all
          Region.count.should == 0
        end
        
        it "is valid" do
          point = new_feature_point :the_geom => a_point.the_geom, :nil_the_geom => true # ensures we don't create regions
          point.should be_valid
        end
      end
    end
  end
  
  # instance methods
  describe "a point" do
    attr_reader :point
    
    before do
      @point = create_feature_point
    end
    
    describe "as json" do
      context "with a location type" do
        attr_reader :location_type
        before do
          @location_type = create_location_type
          point.location_type = location_type
          point.save
        end
        
        context "without a marker" do
          it "does not include location_type in json" do
            point.as_json.has_key?(:location_type).should_not be
          end
        end
        
        context "with a marker" do
          before do
            create_marker :location_type => location_type
          end
          it "includes location_type in json" do
            point.as_json.has_key?(:location_type).should be
          end
        end
      end
    end
    
    context "without supports" do
      before do
        point.votes.destroy_all
      end
      
      it "has a support_count of 0" do
        point.support_count.should == 0
      end
    end
    
    context "with supports" do      
      it "vote_count increases" do
        lambda {
          create_vote :supportable => point
        }.should change(point, :support_count).by(1)
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
        @user = create_profile.user
        point.profile = user.profile
      end
      
      it "displays submitter display name" do
        point.display_submitter.should == point.profile.name
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
        create_vote :supportable => point, :profile => create_profile
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
  
  describe "after_create" do
    context "when there is an associated user" do
      attr_reader :user, :feature_point
      
      before do
        @user          = create_profile.user
        @feature_point = new_feature_point :profile => user.profile
      end
      
      it "creates a new support" do
        lambda {
          feature_point.save
        }.should change(Vote, :count).by(1)
      end
      
      it "associates new support with user" do
        feature_point.save
        Vote.last.user.should == user
      end
    end
    
    context "when there is an associated profile" do
      attr_reader :profile, :feature_point
      
      before do
        @profile       = create_profile :user => nil
        @feature_point = new_feature_point :profile => profile
      end
      
      it "creates a new support" do
        lambda {
          feature_point.save
        }.should change(Vote, :count).by(1)
      end
      
      it "associates new support with profile" do
        feature_point.save
        Vote.last.profile.should == profile
      end
    end
  end
end
