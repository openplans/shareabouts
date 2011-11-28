class ChangeFeaturePointsAddVisibleFlag < ActiveRecord::Migration
  def up
    add_column :feature_points, :visible, :boolean
    FeaturePoint.find_each { |point| point.update_attribute :visible, true}
  end
  
  def down
    remove_column :feature_points, :visible
  end
end
