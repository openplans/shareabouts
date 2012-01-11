class CreateActivityItems < ActiveRecord::Migration
  def change
    create_table :activity_items do |t|
      t.string :subject_type, :user_name
      t.integer :subject_id, :user_id
      t.timestamps
    end
    
    add_index :activity_items, [:subject_type, :subject_id]
  end
end