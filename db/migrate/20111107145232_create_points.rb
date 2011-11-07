# requires cartodb

class CreatePoints < ActiveRecord::Migration
  
  def up
    CartoDB::Connection.create_table Point.table_name, [{}], 'POINT'
  end
  
  def down
    CartoDB::Connection.drop_table Point.table_name
  end
end
