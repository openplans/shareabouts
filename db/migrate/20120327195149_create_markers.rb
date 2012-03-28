class CreateMarkers < ActiveRecord::Migration
  def change
    create_table :markers do |t|
      t.integer :location_type_id, :icon_width, :icon_height, :icon_anchor_x, :icon_anchor_y, :popup_anchor_x, :popup_anchor_y
      t.timestamps
    end
  end
end
