class AddProfileIdToFeaturePoints < ActiveRecord::Migration
  def change
    add_column :feature_points, :profile_id, :integer
    add_index :feature_points, :profile_id
    
    FeaturePoint.find_each do |feature_point|
      next unless feature_point.respond_to?(:user_id) && feature_point.user_id.present?
      feature_point.update_attribute :profile_id, User.find(feature_point.user_id).try(:profile).try(:id)
    end
  end
end
