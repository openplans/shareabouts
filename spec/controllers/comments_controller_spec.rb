require 'spec_helper'

describe CommentsController do
  attr_reader :feature_point, :user
  
  before do
    @feature_point = create_feature_point
    @user          = create_profile.user
  end
  
  describe "POST create" do
    context "when logged in" do  
      before do
        sign_in user
        xhr :post, :create, :feature_point_id => feature_point.id, :comment => { :comment => "t" }
      end
      
      it "is assigns comment" do
        assigns(:comment).should_not be_new_record
      end
      
      it "associates assigned comment with user" do
        assigns(:comment).user.should == user
      end
    end
      
    context "when not logged in" do
      before do
        xhr :post, :create, :feature_point_id => feature_point.id, :comment => { :comment => "t" }
      end
      it "is assigns comment" do
        assigns(:comment).should_not be_new_record
      end
    end
  end
end
