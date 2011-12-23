require 'spec_helper'

describe Page do
  describe "validations" do
    describe "slug" do      
      context "when not uniq" do
        attr_reader :page
        
        before do
          @page = new_page :slug => create_page.slug
          page.valid?
        end
        
        it "is invalid" do
          page.should_not be_valid
        end
        
        it "has error on slug" do
          page.errors[:slug].should be
        end
      end
    end
    
    describe "title" do
      context "when absent" do
        attr_reader :page
        
        before do
          @page = new_page :title => nil
          page.valid?
        end
        
        it "is invalid" do
          page.should_not be_valid
        end
        
        it "has error on slug" do
          page.errors[:title].should be
        end
      end
    end
    
    describe "author_id" do
      context "when absent" do
        attr_reader :page
        
        before do
          @page = new_page :author => nil
          page.valid?
        end
        
        it "is invalid" do
          page.should_not be_valid
        end
        
        it "has error on slug" do
          page.errors[:author].should be
        end
      end
    end
    
    describe "status" do
      context "when absent" do
        attr_reader :page
        
        before do
          @page = new_page :status => nil
          page.valid?
        end
        
        it "is invalid" do
          page.should_not be_valid
        end
        
        it "has error on slug" do
          page.errors[:status].should be
        end
      end
      
      
        context "when not in set" do
          attr_reader :page

          before do
            @page = new_page :status => "cool"
            page.valid?
          end

          it "is invalid" do
            page.should_not be_valid
          end

          it "has error on slug" do
            page.errors[:status].should be
          end
        end
    end
  end
  
  describe "before save" do
    context "where theres a slug" do
      attr_reader :page
      before do
        @page = new_page :slug => "coolslug"
      end

      it "populates slug" do
        page.save
        page.slug.should == "coolslug"
      end
    end
    
    context "when there's no slug" do
      attr_reader :page
      before do
        @page = new_page :slug => nil
      end
      
      it "populates slug" do
        page.save
        page.slug.should be
      end
    end
  end
end
