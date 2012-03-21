require 'spec_helper'

describe User do
  
  it { should have_many(:activity_items)}
  it { should have_many(:feature_points)}
  it { should have_many(:feature_polygons)}
  it { should have_many(:votes)}
  it { should have_many(:comments)}
  it { should have_one(:profile)}
  
  describe "OAuth finders" do
    describe "find_for_twitter_oauth" do
      attr_reader :access_token
      
      before do
        @access_token = {
          "extra" => {
            "raw_info" => {
              "screen_name" => Faker::Internet.user_name,
              "name"        => Faker::Name.name,
              "id"          => 1
            }
          }
        }
      end
      
      context "when an existing user" do
        attr_reader :user
        
        before do
          @user = create_profile(:email => "@#{access_token["extra"]["raw_info"]["screen_name"]}").user
        end
        
        it "returns the existing user" do
          pending "setting email in user builder not working"
          User.find_for_twitter_oauth(access_token).should == user
        end
      end
      
      context "when a non-existing user" do
        it "creates a new user" do
          lambda{
            User.find_for_twitter_oauth(access_token)
          }.should change {User.count}.by(1)
        end
        
        it "creates a new profile" do
          lambda{
            User.find_for_twitter_oauth(access_token)
          }.should change {Profile.count}.by(1)
        end
        
        it "populates the created profile's name" do
          profile = User.find_for_twitter_oauth(access_token).profile
          profile.name.should == access_token["extra"]["raw_info"]["name"]
        end
      end
    end
    
    describe "find_for_facebook_oauth" do
      attr_reader :access_token
      
      before do
        @access_token = {
          "extra" => {
            "raw_info" => {
              "email" => Faker::Internet.email,
              "name"  => Faker::Name.name,
              "id"    => 1
            }
          }
        }
      end
      
      context "when an existing user" do
        attr_reader :user
        
        before do
          @user = create_profile(:email => access_token["extra"]["raw_info"]["email"]).user          
        end
        
        it "returns the existing user" do
          pending "setting email in user builder not working"
          User.find_for_facebook_oauth(access_token).should == user
        end
      end
      
      context "when a non-existing user" do
        it "creates a new user" do
          lambda{
            User.find_for_facebook_oauth(access_token)
          }.should change {User.count}.by(1)
        end
        
        it "creates a new profile" do
          lambda{
            User.find_for_facebook_oauth(access_token)
          }.should change {Profile.count}.by(1)
        end
        
        it "populates the created profile's name" do
          profile = User.find_for_facebook_oauth(access_token).profile
          profile.name.should == access_token["extra"]["raw_info"]["name"]
        end
      end
    end
  end
end
