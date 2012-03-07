require 'geo_ruby/shp'

class ShapefileJob
  include GeoRuby::Shp4r
      
  def initialize(shapefile_path, shapefile_id=nil)
    @shapefile_path = shapefile_path
    @shapefile_id   = shapefile_id
  end

  def perform
    shapefile.import!
  
    log "importing regions from #{@shapefile_path}"
  
    shp_path      = ShapefileImportHelper.reproject ShapefileImportHelper.unzip( @shapefile_path )
    regions_count = create_regions shp_path
  
    log "imported #{regions_count} regions."    
  end

  def create_regions(shp_file)    
    count = 0
  
    ShpFile.open(shp_file) do |shp|      
      shp.each do |shape|                      
        Region.create :shapefile_id => @shapefile_id, :the_geom => shape.geometry, :metadata => shape.data.attributes
        count += 1
      end
    end
  
    count
  end
  
  def max_attempts
    1
  end
  
  # Delayed::Job callbacks
  def success(job)
    shapefile.complete!
  end

  def error(job,exception)
    shapefile.error! exception
  end

  private

  def shapefile
    Shapefile.find @shapefile_id
  end

  def log(message)
    Delayed::Job.logger.info message
  end

end
