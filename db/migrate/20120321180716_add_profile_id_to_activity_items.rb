class AddProfileIdToActivityItems < ActiveRecord::Migration
  def change
    add_column :activity_items, :profile_id, :integer
    add_index :activity_items, :profile_id
    
    ActivityItem.find_each do |activity_item|
      next unless activity_item.respond_to?(:user_id) && activity_item.user_id.present?
      activity_item.update_attribute :profile_id, User.find(activity_item.user_id).try(:profile).try(:id)
    end
  end
end
