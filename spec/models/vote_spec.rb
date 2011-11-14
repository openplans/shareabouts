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
      @vote = create_feature_point
    end
    
    context "votes" do
      attr_accessor :point
      
      before do
        @point = create_vote :supportable => vote
      end
      
      it "has_many" do
        vote.votes.should include(point)
      end
    end
  end
end
