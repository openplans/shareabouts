class AddTwitterIdToUsers < ActiveRecord::Migration
  def change
    change_table :users do |t|
      t.integer :twitter_id
    end
  end
end
