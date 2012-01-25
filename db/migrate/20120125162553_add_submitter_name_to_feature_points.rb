class AddSubmitterNameToFeaturePoints < ActiveRecord::Migration
  def change
    add_column :feature_points, :submitter_name, :string
  end
end
