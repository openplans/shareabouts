require 'spec_helper'

describe ApplicationController do
  describe "current_profile" do
    context "when there is a current_user present" do
      attr_reader :user
      
      before do
        @user = create_profile.user
        sign_in user
      end
      
      it "returns the current_user's profile" do
        controller.current_profile.should == user.profile
      end
    end
    
    context "when there is a profile cookie set" do
      attr_reader :profile
      
      before do
        @profile = create_profile
        controller.send(:set_profile_cookie, profile)
      end
      
      it "returns the marshalled profile set in cookie" do
        controller.current_profile.should == profile
      end
    end
    
    context "when there is no profile cookie set" do
      context "when there is a profile for the current ip and user agent" do
        attr_reader :profile

        before do
          @profile = create_profile :user => nil
          request.stub!(:env).and_return({ "HTTP_USER_AGENT" => profile.user_agent})
          request.stub!(:remote_ip).and_return( profile.client_ip )
        end
        
        it "returns the profile identified by ip and user agent" do
          controller.stub!(:current_user).and_return(nil)
          controller.current_profile.should == profile
        end
      end
      
      context "when there is no profile for the current ip and user agent" do
        it "does not create a new profile" do
          lambda {
            controller.current_profile
          }.should_not change(Profile, :count).by(1)
        end
      end
    end
  end
  
  describe "find_or_create_profile" do
    context "when there is no profile for the current ip and user agent" do
      it "creates a new profile" do
        lambda {
          controller.find_or_create_profile
        }.should change(Profile, :count).by(1)
      end
      
      it "saves a profile to cookies" do
        pending
        controller.find_or_create_profile
        cookies[:profile].should(be)
        Marshal.load(cookies[:profile]).should(be_kind_of Profile)
      end
      
      it "returns the new profile" do
        profile = controller.find_or_create_profile
        profile.client_ip.should == request.remote_ip
        profile.user_agent.should == request.env["HTTP_USER_AGENT"]
      end
    end
  end
  
  describe "set_profile_cookie" do
    attr_reader :profile
    
    before do
      @profile = create_profile
    end
    
    it "sets a cookie for :profile" do
      pending
      controller.send(:set_profile_cookie, profile)
      cookies[:profile].should be
    end
    
    it "returns the profile" do
      controller.send(:set_profile_cookie, profile).should == profile
    end
  end
end