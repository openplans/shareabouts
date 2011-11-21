require 'spec_helper'

describe User do
  describe "associations" do
    attr_accessor :user
    
    before do
      @user = create_user
    end
    
    context "feature_points" do
      attr_accessor :feature_point

      before do
        pending "feature points in specs"
        @feature_point = create_feature_point :user_id => user.id
      end
      
      it "has_many" do
        @user.feature_points.should include(feature_point)
      end
    end
    
    context "votes" do
      attr_accessor :vote

      before do
        # not really supporting self, but getting around geom issues in specs
        @vote = create_vote :user_id => user.id, :supportable => user
      end
      
      it "has_many" do
        @user.votes.should include(vote)
      end
    end
  end
end
