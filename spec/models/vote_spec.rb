require 'spec_helper'

describe Vote do
  describe "validations" do
    describe "supportable" do
      context "when absent" do
        attr_accessor :vote
        
        before do
          @vote = new_vote :supportable => nil
        end
        
        it "is invalid" do
          @vote.should_not be_valid
        end
      end
    end
  end
  
  describe "associations" do
    attr_accessor :vote
    
    before do
      pending "spatial_adapter not working in specs"
      
      @vote = create_feature_point
    end
    
    context "user" do
      attr_accessor :user
      
      before do
        @user = create_user
        vote.update_attribute :user_id, user.id
      end
      
      it "belongs_to" do
        vote.user.should == user
      end
    end
    
    context "supportable" do
      attr_accessor :point
      
      before do
        @point = create_point
        vote.update_attributes :supportable_id => point.id, :supportable_type => "FeaturePoint"
      end
      
      it "belongs_to" do
        vote.supportable.should == point
      end
    end
  end
end
