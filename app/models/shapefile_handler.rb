require 'geo_ruby/shp'

class ShapefileHandler
  include GeoRuby::Shp4r
  
  TempDir = "#{Rails.root.to_s}/tmp"
    
  def initialize(files, directory_prefix, region_params, field_names)
    @directory   = "#{TempDir}/#{directory_prefix}#{Time.now.to_i}"
    @regions     = region_params
    @field_names = field_names
    
    FileUtils.mkdir_p @directory

    for type, file in files
      name = file.original_filename
      path = File.join(@directory, name)
      
      FileUtils.mv file.tempfile.path, path
      
      instance_variable_set "@#{type}_file".to_sym, path
    end
  end
  
  def perform
    puts "INFO importing regions from #{@shp_file}"
    
    if @prj_file.present?
      Rails.logger.debug "=====RUNNING ogr2ogr -t_srs EPSG:4326 #{File.join(@directory, "out_4326.shp")} #{File.join(@directory, @shp_file}====="
      Rails.logger.debug `ogr2ogr -t_srs EPSG:4326 #{File.join(@directory, "out_4326.shp")} #{File.join(@directory, @shp_file)} 2>&1` 
      @shp_file = File.join(@directory, "out_4326.shp")
    end
    
    regions_count = handler.create_regions @regions, @field_names
    
    puts "INFO imported #{regions_count} regions."
    
    FileUtils.rm_rf @directory
  end
  
  def create_regions(region_attrs, field_names)
    file_fields_to_attrs = field_names.inject({}) { |m, (k, v)| m[v] = k if v.present?; m }
    
    count = 0
    ShpFile.open(@shp_file) do |shp|
      my_attrs = region_attrs
      
      shp.each do |shape|
        my_attrs[:the_geom] = shape.geometry # GeoRuby SimpleFeature
        
        shp.fields.each do |field|
          my_attrs[file_fields_to_attrs[field.name]] = shape.data[field.name] if file_fields_to_attrs.key?(field.name)
        end
                
        Region.create my_attrs
        count += 1
      end
    end
    
    count
  end
end