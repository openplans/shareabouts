require 'geo_ruby/shp'

class FeaturePolygonJob
  include GeoRuby::Shp4r
      
  def initialize(shapefile_path, shapefile_id=nil)
    @shapefile_path     = shapefile_path
    @feature_polygon_id = shapefile_id
  end

  def perform
    feature_polygon.import!
  
    log "importing polygon from #{@shapefile_path}"
  
    shp_path = ShapefileImportHelper.reproject ShapefileImportHelper.unzip( @shapefile_path )
  
    create_polygon shp_path  
  end

  def create_polygon(shp_file)
    ShpFile.open(shp_file) do |shp|      
      shape = shp.first             
      feature_polygon.update_attribute :the_geom, shape.geometry
    end
  end
  
  def max_attempts
    1
  end

  # Delayed::Job callbacks
  def success(job)
    feature_polygon.complete!
  end

  def error(job,exception)
    feature_polygon.error! exception
  end

  private

  def feature_polygon
    @feature_polygon ||= FeaturePolygon.find @feature_polygon_id
  end

  def log(message)
    Delayed::Job.logger.info message
  end

end
