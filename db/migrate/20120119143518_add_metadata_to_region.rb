class AddMetadataToRegion < ActiveRecord::Migration
  def change
    add_column :regions, :metadata, :text
  end
end
