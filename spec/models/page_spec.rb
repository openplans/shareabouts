require 'spec_helper'

describe Page do
  describe "validations" do
    describe "slug" do      
      context "when not uniq" do
        attr_reader :page
        
        before do
          Admin.current_admin = create_admin
          
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
        
        it "has error on title" do
          page.errors[:title].should be
        end
      end
    end
    
    # Author is set automatically
    # describe "author_id" do
    #   context "when absent" do
    #     attr_reader :page
    #     
    #     before do
    #       @page = new_page :author => nil
    #       page.valid?
    #     end
    #     
    #     it "is invalid" do
    #       page.should_not be_valid
    #     end
    #     
    #     it "has error on author" do
    #       page.errors[:author].should be
    #     end
    #   end
    # end
    
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
        
        it "has error on status" do
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

          it "has error on status" do
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
    
    context "when welcome_page has been changed to true" do
      attr_reader :old_welcome_page, :page
      before do
        Admin.current_admin = create_admin
        @old_welcome_page = create_page :welcome_page => true
        
        @page = new_page :welcome_page => true
      end
      
      it "changes old welcome page to false" do
        page.save
        
        old_welcome_page.reload.should_not be_welcome_page
      end
    end
    
    context "when welcome_page has not been changed to true" do
      attr_reader :old_welcome_page, :page
      before do
        Admin.current_admin = create_admin
        @old_welcome_page = create_page :welcome_page => true
        
        @page = new_page :welcome_page => false
      end
      
      it "keeps old welcome page" do
        page.save
        
        old_welcome_page.reload.should be_welcome_page
      end
    end
  end
end
