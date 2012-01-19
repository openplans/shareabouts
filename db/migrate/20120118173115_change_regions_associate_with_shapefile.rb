class ChangeRegionsAssociateWithShapefile < ActiveRecord::Migration
  def up
    add_column :regions, :shapefile_id, :integer
    
    # Region.find_each do |region|
    #   if shapefile = Shapefile.where(:kind => region.kind).first
    #     region.update_attribute :shapefile_id, shapefile.id
    #   else
    #     shapefile = Shapefile.create :kind => region.kind
    #     region.update_attribute :shapefile_id, shapefile.id
    #   end
    # end
        
    remove_column :regions, :kind
  end

  def down
    add_column :regions, :kind, :string
    remove_column :regions, :shapefile_id
  end
end
