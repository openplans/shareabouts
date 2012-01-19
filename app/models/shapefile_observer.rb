class ShapefileObserver < ActiveRecord::Observer
  
  def after_create(shapefile)
    handler = ShapefileHandler.new( shapefile.id, shapefile.data.path )
    handler.perform
  end
  
end