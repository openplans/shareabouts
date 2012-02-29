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
end