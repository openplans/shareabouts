require 'spec_helper'

describe FeaturePointsController do
  describe "GET index" do
    context "with format JSON" do
      it "is a success" do
        xhr :get, :index
        response.should be_success
      end
    end
    
    context "with format HTML" do
      it "is a success" do
        get :index
        response.should be_success
      end
    end
  end
  
  describe "GET new" do
    context "with format JSON" do
      it "assigns a new feature point" do
        xhr :get, :new
        assigns(:feature_point).as_json.should eq(FeaturePoint.new.as_json)
      end
    end
  end
  
  describe "POST create" do
    context "with format JSON" do
      context "with good params" do
        it "creates a feature point" do
          pending
          xhr :post, :create
          
          assigns(:feature_point).should be_valid?
          assigns(:feature_point).should_not be_new_record?
        end
      end
      
      context "with bad params" do
        it "instantiates an infeature point" do
          pending
          xhr :post, :create
          assigns(:feature_point).should_not be_valid?
        end
      end
    end
  end
  
  describe "PUT update" do
    context "for authorized updater" do
      it "updates the feature point" do
        pending
        xhr :put, :update
      end
    end
    
    context "for unauthorized visitor" do
      it "raises an authorization error" do
        pending
        xhr :put, :update
      end
    end
  end
  
  describe "GET show" do
    context "with format JSON" do
      it "assigns the feature point" do
        pending
        xhr :show
      end
    end
  end
end
