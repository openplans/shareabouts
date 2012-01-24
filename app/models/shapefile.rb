class Shapefile < ActiveRecord::Base
  
  class ZipContentValidator < ActiveModel::Validator
    def validate(record)
      extensions = ShapefileJob.new(record.data.to_file.path).unzip.map { |z| File.extname z.to_s }
      
      complete = %w{.shx .shp .dbf}.all? do |ext|
        extensions.include? ext
      end
      
      record.errors[:data] << "Zip file must at least contain .shx, .shp, and .dbf files." unless complete
    end
  end
  
  has_many :regions, :inverse_of => :shapefile
  
  has_attached_file :data # zip file
  
  validates :kind, :presence => true, :uniqueness => true
  validates :name_field, :presence => true
  
  validates_attachment_presence :data
  validates_attachment_content_type :data, :content_type => "application/zip", :if => :attachment_present?
  validates_with ZipContentValidator, :if => :attachment_present?
  
  after_create :enqueue_importer
    
  include Workflow
  workflow do
    state :unprocessed do
      event :import, :transitions_to => :importing
    end
    state :importing do
      event :complete, :transitions_to => :complete
      event :error, :transitions_to => :import_error
    end
    state :complete
    state :import_error
  end
  
  def error(message)
    update_attribute :job_error, message
  end
  
  private
  
  def attachment_present?
    data.present?
  end
  
  def enqueue_importer
    Delayed::Job.enqueue ShapefileJob.new(data.path, id)
  end
  
end
