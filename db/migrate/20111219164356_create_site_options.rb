class CreateSiteOptions < ActiveRecord::Migration
  def change
    create_table :site_options do |t|
      t.string :option_name
      t.text :option_value
      t.timestamps
    end
    
    add_index :site_options, :option_name, :unique => true
  end
end
