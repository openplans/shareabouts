require 'spec_helper'

describe Admin do
  describe "an admin" do
    context "with level 100" do
      attr_reader :admin
      
      before do
        @admin = create_admin :level => 100
      end
      
      it "is a superadmin" do
        admin.role?(:superadmin).should be
      end
    end
    
    context "without a set level" do
      attr_reader :admin
      
      before do
        @admin = create_admin :level => nil
      end
      
      it "is not a superadmin" do
        admin.role?(:superadmin).should_not be
      end
      
      it "has level 0" do
        admin.level.should == 0
      end
    end
  end
end
