class ShapefileContentValidator < ActiveModel::Validator
  def validate(record)
    files      = Dir.glob("#{ ShapefileImportHelper.unzip(record.attachment.to_file.path) }/*")
    extensions = files.map { |z| File.extname z.to_s }
    
    complete = %w{.shx .shp .dbf}.all? do |ext|
      extensions.include? ext
    end
  
    record.errors[:data] << "Zip file must at least contain .shx, .shp, and .dbf files." unless complete
  end
end
