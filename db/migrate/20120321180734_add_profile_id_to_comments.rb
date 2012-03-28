class AddProfileIdToComments < ActiveRecord::Migration
  def change
    add_column :comments, :profile_id, :integer
    add_index :comments, :profile_id
    
    Comment.find_each do |comment|
      next unless comment.respond_to?(:user_id) && comment.user_id.present?
      comment.update_attribute :profile_id, User.find(comment.user_id).try(:profile).try(:id)
    end
  end
end
