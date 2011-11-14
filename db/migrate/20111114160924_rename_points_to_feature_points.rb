class RenamePointsToFeaturePoints < ActiveRecord::Migration
  def up
    rename_table :points, :feature_points
  end

  def down
    rename_table :feature_points, :points
  end
end
