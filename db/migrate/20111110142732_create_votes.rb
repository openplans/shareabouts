class CreateVotes < ActiveRecord::Migration
  def change
    create_table :votes do |t|
      t.integer :supportable_id
      t.string :supportable_type, :supporter_ip

      t.timestamps
    end
    
    add_index :votes, [:supportable_type, :supportable_id]
  end
end
