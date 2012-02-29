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
  
    output_dir = ShapefileImportHelper.unzip @shapefile_path
  
                     # if there's a projection file
    shp_path = if Dir.glob( "#{output_dir}/*.prj" ).first
      shapefile_path = Dir.glob( "#{output_dir}/*.shp" ).first
      output_path    = "#{output_dir}/out_4326.shp"
    
      command = "export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH && ogr2ogr -t_srs EPSG:4326 #{output_path} #{shapefile_path} 2>&1"
      log "=====RUNNING #{command}"
      output = `#{command}`
      log output
    
      output_path
    else #no projection file, use original shapefile
      Dir.glob( "#{output_dir}/*.shp" ).firstb
    end
  
    create_polygon shp_path  
  end

  def create_polygon(shp_file)
    ShpFile.open(shp_file) do |shp|      
      shape = shp.first             
      feature_polygon.update_attribute :the_geom, shape.geometry
    end
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
