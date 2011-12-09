class AddUserToCommentAndVote < ActiveRecord::Migration
  def up
    add_column :comments, :user_id, :integer

    add_index :comments, :user_id
    add_index :votes, :user_id
    
    remove_column :comments, :commenter_ip
    remove_column :votes, :supporter_ip
  end
  
  def down
    add_column :votes, :supporter_ip, :string
    add_column :comments, :commenter_ip, :string

    remove_column :comments, :user_id, :integer
  end
end
