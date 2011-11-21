class AddUserIdToFeaturePoints < ActiveRecord::Migration
  def change
    add_column :feature_points, :user_id, :integer
  end
end
