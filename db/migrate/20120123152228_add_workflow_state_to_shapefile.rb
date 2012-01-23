class AddWorkflowStateToShapefile < ActiveRecord::Migration
  def change
    add_column :shapefiles, :workflow_state, :string
  end
end
