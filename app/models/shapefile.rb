class Shapefile < ActiveRecord::Base
  
  class ZipContentValidator < ActiveModel::Validator
    def validate(record)
      extensions = ShapefileHandler.new(record.data.to_file.path).unzip.map { |z| File.extname z.to_s }
      
      complete = %w{.shx .shp .dbf}.all? do |ext|
        extensions.include? ext
      end
      
      record.errors[:data] << "Zip file must at least contain .shx, .shp, and .dbf files." unless complete
    end
  end
    
  has_many :regions, :inverse_of => :shapefile
  
  has_attached_file :data
  
  validates :kind, :presence => true, :uniqueness => true
  validates :name_field, :presence => true
  
  validates_attachment_presence :data
  validates_attachment_content_type :data, :content_type => "application/zip", :if => :attachment_present?
  validates_with ZipContentValidator, :if => :attachment_present?
  
  private
  
  def attachment_present?
    data.present?
  end
  
end
