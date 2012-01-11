require 'spec_helper'

describe ActivityItem do
  describe "validations" do
    describe "subject" do
      context "when absent" do
        attr_accessor :activity_item
        
        before do
          @activity_item = new_activity_item :subject => nil
        end
        
        it "is invalid" do
          activity_item.should_not be_valid
        end
        
        it "has error on subject" do
          activity_item.valid?
          activity_item.errors[:subject].should be_present
        end
      end
    end
  end
  
  describe "relations" do
    describe "subject" do
      context "when a vote" do
        attr_accessor :vote, :activity_item
        
        before do
          @vote = create_vote
          @activity_item = vote.activity_items.create
        end
        
        it "is a vote" do
          activity_item.subject.should == vote
        end
      end
    end
  end
end
