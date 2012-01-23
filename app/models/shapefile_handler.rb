require 'geo_ruby/shp'
require 'zip/zip'

class ShapefileHandler
  include GeoRuby::Shp4r
        
  def initialize(shapefile_path, shapefile_id=nil)
    @shapefile_path = shapefile_path
    @shapefile_id   = shapefile_id
  end
  
  def unzip(file=nil)
    destination = File.dirname( file || @shapefile_path )
    dir         = [] 
    
    file_list = Zip::ZipFile.open( file || @shapefile_path ) do |zip_file|
      zip_file.each do |f|
        f_path = File.join(destination, f.name)
        dir    = FileUtils.mkdir_p( File.dirname f_path )
        zip_file.extract( f, f_path ) unless File.exist?( f_path )
      end
    end
    
    @output_dir = dir.first
    
    file_list
  end
  
  def perform
    log "importing regions from #{@shapefile_path}"
    
    output_dir = unzip @shapefile_path
    
                     # if there's a projection file
    shapefile_path = if Dir.glob( "#{output_dir}/*.prj" ).first
      shapefile_path = Dir.glob( "#{output_dir}/*.shp" ).first
      output_path    = "#{output_dir}/out_4326.shp"
      
      command = "export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH && ogr2ogr -t_srs EPSG:4326 #{output_path} #{shapefile_path} 2>&1"
      log "=====RUNNING #{command}"
      output = `#{command}` 
      log output
      
      output_path
    else #no projection file, use original shapefile
      Dir.glob( "#{output_dir}/*.shp" ).first
    end
    
    regions_count = create_regions shapefile_path
    
    log "imported #{regions_count} regions."    
  end
  
  def create_regions(shp_file)    
    count = 0
    
    ShpFile.open(shp_file) do |shp|      
      shp.each do |shape|
        r = Region.create :shapefile_id => @shapefile_id, :the_geom => shape.geometry # GeoRuby SimpleFeature
        count += 1
      end
    end
    
    count
  end
  
  private
  
  def log(message)
    Rails.logger.info message
  end
  
end