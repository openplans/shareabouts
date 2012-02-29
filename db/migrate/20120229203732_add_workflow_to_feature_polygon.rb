class AddWorkflowToFeaturePolygon < ActiveRecord::Migration
  def change
    change_table :feature_polygons do |t|
      t.string :workflow_state
      t.text :job_error
    end
  end
end