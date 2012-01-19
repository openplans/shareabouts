class Shapefile < ActiveRecord::Base
    
  has_many :regions, :inverse_of => :shapefile
  
  has_attached_file :data
  
  validates :kind, :presence => true, :uniqueness => true
  validates_attachment_content_type :data, :content_type => "application/zip"
  
end
