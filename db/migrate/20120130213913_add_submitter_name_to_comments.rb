class AddSubmitterNameToComments < ActiveRecord::Migration
  def change
    add_column :comments, :submitter_name, :string
  end
end
