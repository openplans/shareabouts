class CreateFeatureRegions < ActiveRecord::Migration
  def change
    create_table :feature_regions do |t|
      t.string :feature_type
      t.integer :feature_id, :region_id
      t.timestamps
    end
  end
end
