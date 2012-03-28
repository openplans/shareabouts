require 'spec_helper'

describe FeaturePolygon do
  it { should belong_to(:profile) }
  
  describe "a feature_polygon" do
    context "when setting the_geom_from_points" do
      attr_reader :feature_polygon
      before do
        @feature_polygon = FeaturePolygon.new
        feature_polygon.the_geom_from_points = [[1,2],[3,4]]
      end
      it "sets the_geom as a MultiPolygon" do
        feature_polygon.the_geom.class.should == GeoRuby::SimpleFeatures::MultiPolygon
      end
      it "has 2 points" do
        feature_polygon.the_geom.points.size.should == 2
      end
    end
  end
end
