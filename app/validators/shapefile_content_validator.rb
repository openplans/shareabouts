class ShapefileContentValidator < ActiveModel::Validator
  def validate(record)
    extensions = ShapefileJob.new(record.data.to_file.path).unzip.map { |z| File.extname z.to_s }
  
    complete = %w{.shx .shp .dbf}.all? do |ext|
      extensions.include? ext
    end
  
    record.errors[:data] << "Zip file must at least contain .shx, .shp, and .dbf files." unless complete
  end
end
