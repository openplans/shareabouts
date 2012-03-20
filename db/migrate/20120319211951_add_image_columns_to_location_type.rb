class AddImageColumnsToLocationType < ActiveRecord::Migration
  def self.up
    change_table :location_types do |t|
      t.has_attached_file :image
    end
  end

  def self.down
    drop_attached_file :location_types, :image
  end
end
