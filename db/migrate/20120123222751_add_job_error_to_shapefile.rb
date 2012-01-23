class AddJobErrorToShapefile < ActiveRecord::Migration
  def change
    add_column :shapefiles, :job_error, :text
  end
end
