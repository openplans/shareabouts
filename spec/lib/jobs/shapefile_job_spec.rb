require 'spec_helper'

describe ShapefileJob do
  describe "unzip" do
    context "when given a shapefile archive containing multiple folders" do
      it "sets the directory containing the shp file as the output_dir" do
        pending
      end
    end
    context "when given a shapefile archive containing no directories" do
      it "sets the archive directory as the output_dir" do
        pending
      end
    end
  end
end
