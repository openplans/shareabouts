require 'spec_helper'
require 'ostruct'

describe Profile do
  attr_reader :profile
  
  before do
    @profile = create_profile
  end
  
  it { should belong_to(:user) }
  it { should have_many(:activity_items) }
  it { should have_many(:comments) }
  it { should have_many(:feature_points) }
  it { should have_many(:feature_polygons) }
  it { should have_many(:votes) }
  
  it { should validate_uniqueness_of(:user_agent).scoped_to(:client_ip) }
  it { should validate_uniqueness_of(:user_id) }
  
  describe "self.create_by_request_fingerprint" do
    attr_reader :request
    
    before do
      @request = OpenStruct.new :env => { 'HTTP_USER_AGENT' => Faker::Lorem.sentence }, :remote_ip => Array.new(4){rand(256)}.join('.')
    end
    
    it "creates a new profile" do
      lambda {
        Profile.create_by_request_fingerprint( request )
      }.should change(Profile, :count).by(1)
    end
    
    it "returns newly created profile" do
      profile = Profile.create_by_request_fingerprint( request )
      profile.client_ip.should == request.remote_ip
      profile.user_agent.should == request.env['HTTP_USER_AGENT']
    end
  end
  
  describe "self.find_by_request_fingerprint" do
    attr_reader :request
  
    context "when an existing authenticated user matches fingerprint" do
      before do
        @request = OpenStruct.new :env => { 'HTTP_USER_AGENT' => profile.user_agent }, :remote_ip => profile.client_ip
      end
      
      it "returns nil" do
        Profile.find_by_request_fingerprint( request ).should == nil
      end
    end
    
    context "when a non-authenticated user matches fingerprint" do
      before do
        @profile = create_profile :user => nil
        @request = OpenStruct.new :env => { 'HTTP_USER_AGENT' => profile.user_agent }, :remote_ip => profile.client_ip
      end

      it "returns existing profile" do
        Profile.find_by_request_fingerprint( request ).should == profile
      end
    end
  end
end
