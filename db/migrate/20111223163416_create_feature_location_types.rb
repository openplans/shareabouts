class CreateFeatureLocationTypes < ActiveRecord::Migration
  def change
    create_table :feature_location_types do |t|
      t.integer :feature_id, :location_type_id
      t.string :feature_type
      t.timestamps
    end
  end
end
