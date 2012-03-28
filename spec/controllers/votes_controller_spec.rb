require 'spec_helper'

describe VotesController do
  attr_reader :feature_point, :user
  
  before do
    @feature_point = create_feature_point
    @user          = create_profile.user
  end
  
  describe "POST create" do
    context "when logged in" do  
      before do
        sign_in user
        xhr :post, :create, :feature_point_id => feature_point.id
      end
      
      it "is assigns vote" do
        assigns(:vote).should_not be_new_record
      end
      
      it "associates assigned vote with user" do
        assigns(:vote).user.should == user
      end
      
      it "stores vote in cookie" do
        cookie = Marshal.load(response.cookies["supportable"])
        cookie[:FeaturePoint][feature_point.id].should == assigns(:vote).id
      end
    end
      
    context "when not logged in" do
      before do
        xhr :post, :create, :feature_point_id => feature_point.id
      end
      it "is assigns vote" do
        assigns(:vote).should_not be_new_record
      end
      
      it "stores vote in cookie" do
        cookie = Marshal.load(response.cookies["supportable"])
        cookie[:FeaturePoint][feature_point.id].should == assigns(:vote).id      
      end
    end
  end
  
  describe "DELETE destroy" do
    context "when logged in" do
      before do
        sign_in user
      end
      
      context "for own vote" do
        attr_reader :vote
        before do
          xhr :post, :create, :feature_point_id => feature_point.id
          @vote = assigns(:vote)
          
          xhr :delete, :destroy, :feature_point_id => feature_point.id, :id => vote.id
        end
        
        it "is destroys vote" do
          lambda{
            vote.reload
          }.should raise_error(ActiveRecord::RecordNotFound)
        end

        it "destroys vote cookie" do
          cookie = Marshal.load(response.cookies["supportable"])
          cookie[:FeaturePoint][feature_point.id].should_not be
        end
      end
      context "for another's vote" do
        attr_reader :other_user_vote
        before do
          @other_user_vote = feature_point.votes.create :user_id => create_user.id
        end
        
        it "is raises RNF" do
          lambda {
            xhr :delete, :destroy, :feature_point_id => feature_point.id, :id => other_user_vote.id
          }.should raise_error(ActiveRecord::RecordNotFound)
        end

      end
    end
      
    context "when not logged in" do
      context "theres a cookie for this vote" do
        attr_reader :vote
        before do
          xhr :post, :create, :feature_point_id => feature_point.id
          @vote = assigns(:vote)

          xhr :delete, :destroy, :feature_point_id => feature_point.id, :id => vote.id
        end
        
        it "destroys vote" do
          lambda{
            vote.reload
          }.should raise_error(ActiveRecord::RecordNotFound)
        end
        
        it "destroys cookie" do
          cookie = Marshal.load(response.cookies["supportable"])
          cookie[:FeaturePoint][feature_point.id].should_not be
        end
      end
      
      context "theres no cookie for this vote" do
        attr_reader :other_user_vote
        before do
          @other_user_vote = feature_point.votes.create
        end
        
        it "is raises RNF" do
          lambda {
            xhr :delete, :destroy, :feature_point_id => feature_point.id, :id => other_user_vote.id
          }.should raise_error(ActiveRecord::RecordNotFound)
        end
      end
    end
  end
end
