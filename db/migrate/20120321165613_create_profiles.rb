class CreateProfiles < ActiveRecord::Migration
  def up
    create_table :profiles do |t|
      t.integer :user_id
      t.string :zip_code, :email, :name
      t.timestamps
    end
    add_index :profiles, :user_id, :unique => true
    
    User.find_each do |user|
      next if Profile.where(:user_id => user.id).exists?
      
      profile      = user.build_profile :email => user.email
      profile.name = user.name if user.respond_to?(:name)
      profile.save(:validate => false)
    end
  end
  
  def down
    drop_table :profiles
  end
end
