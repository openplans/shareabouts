class AddProfileIdToVotes < ActiveRecord::Migration
  def change
    add_column :votes, :profile_id, :integer
    add_index :votes, :profile_id
    
    Vote.find_each do |vote|
      next unless vote.respond_to?(:user_id) && vote.user_id.present?
      vote.update_attribute :profile_id, User.find(vote.user_id).try(:profile).try(:id)
    end
  end
end
