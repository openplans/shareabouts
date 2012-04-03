require 'zip/zip'

class ShapefileImportHelper
  def self.unzip(file)
    destination = File.dirname( file )
    dirs        = [] 
  
    Zip::ZipFile.open( file ) do |zip_file|
      zip_file.each do |f|
        f_path = File.join(destination, f.name)
        dirs  += FileUtils.mkdir_p( File.dirname f_path )
        zip_file.extract( f, f_path ) unless File.exist?( f_path )
      end
    end
  
    # return the dir that contains the shp file
    dirs.uniq!.select { |d| Dir.glob("#{d}/*.shp").first }.first
  end
  
  def self.reproject(output_dir)
    # If there's a projection file, reproject
    if Dir.glob( "#{output_dir}/*.prj" ).first
      shapefile_path = Dir.glob( "#{output_dir}/*.shp" ).first
      output_path    = "#{output_dir}/out_4326.shp"
    
      command = "export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH && ogr2ogr -t_srs EPSG:4326 #{output_path} #{shapefile_path} 2>&1"
      log "=====RUNNING #{command}"
      output = `#{command}`
      log output
    
      output_path
    else # No projection file, use original shapefile
      Dir.glob( "#{output_dir}/*.shp" ).first
    end
  end
  
  def self.log(message)
    Delayed::Job.logger.info message
  end
end