class CreatePages < ActiveRecord::Migration
  def change
    create_table :pages do |t|
      t.string :title, :slug, :status
      t.text :content
      t.integer :author_id, :menu_order, :parent_id
      t.timestamps
    end
    
    add_index :pages, :slug, :unique => true
    add_index :pages, :status
    add_index :pages, :author_id
    add_index :pages, :parent_id
  end
end
