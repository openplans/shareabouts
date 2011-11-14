require 'spec_helper'

describe Comment do
  describe "validations" do
    describe "comment" do
      context "when absent" do
        attr_accessor :comment
        
        before do
          @comment = new_comment :comment => nil
        end
        
        it "is invalid" do
          comment.should_not be_valid
        end
        
        it "has errors on comment" do
          comment.valid?
          comment.errors[:comment].should be_present
        end
      end
    end
    
    describe "commentable" do
      context "when absent" do
        attr_accessor :comment
        
        before do
          @comment = new_comment :commentable => nil
        end
        
        it "is invalid" do
          @comment.should_not be_valid
        end
        
        it "has errors on comment" do
          comment.valid?
          @comment.errors[:commentable].should be_present
        end
      end
    end
  end
  
  describe "associations" do
    attr_accessor :point
    
    before do
      pending "spatial_adapter not working in specs"
      
      @point = create_feature_point
    end
    
    context "commentable" do
      attr_accessor :point
      
      before do
        @comment = create_comment :commentable => point
      end
      
      it "belongs_to" do
        @comment.commentable.should == point
      end
    end
  end
end
