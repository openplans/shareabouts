class AddProfileIdToFeaturePolygons < ActiveRecord::Migration
  def change
    add_column :feature_polygons, :profile_id, :integer
    add_index :feature_polygons, :profile_id
    
    FeaturePolygon.find_each do |feature_polygon|
      next unless feature_polygon.respond_to?(:user_id) && feature_polygon.user_id.present?
      feature_polygon.update_attribute :profile_id, User.find(feature_polygon.user_id).try(:profile).try(:id)
    end
  end
end
