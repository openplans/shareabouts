class CreateAdmins < ActiveRecord::Migration
  def change
    create_table :admins do |t|
      t.database_authenticatable
      t.lockable
      t.trackable
      t.timestamps
    end
  end
end
