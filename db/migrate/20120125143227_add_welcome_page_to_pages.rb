class AddWelcomePageToPages < ActiveRecord::Migration
  def change
    add_column :pages, :welcome_page, :boolean
  end
end
