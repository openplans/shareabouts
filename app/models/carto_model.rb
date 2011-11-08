class CartoModel
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming
  
  attr_accessor :cartodb_id, :the_geom, :description, :name, :created_at, :updated_at, :lat, :lng
  
  def initialize(attributes = {})
    attributes.each do |name, value|
      send("#{name}=", value)
    end
  end
  
  def self.all
    results = CartoDB::Connection.query "SELECT * FROM #{table_name}"
    results.rows.map do |row|
      attrs = row.select do |attr|
        attributes.include? attr
      end
      new attrs
    end
  end
   
  def self.find(id)
    new( CartoDB::Connection.row table_name, id )
  end
  
  def self.table_name
    "#{Rails.application.class.parent.to_s}_#{Rails.env}_#{self.to_s.tableize}".downcase
  end
  
  def save
    if cartodb_id.present?
      # todo
    else
      response = CartoDB::Connection.insert_row self.class.table_name, 
          :the_geom => the_geom_to_s, :description => description, :name => name, :created_at => Time.now, :updated_at => Time.now
      self.cartodb_id = response[:cartodb_id]
      true
    end
  end
  
  def self.attributes
    [:cartodb_id, :the_geom, :description, :name, :created_at, :updated_at, :lat, :lng]
  end
  
  def persisted?
    false
  end
  
  def lat
    @lat ||= the_geom.try(:lat)
  end
  
  def lng
    @lng ||= the_geom.try(:lon)
  end
  
  private

  def the_geom_to_s
    raise "set lat and lng first" unless lat.present? && lng.present?
    "SRID=4326;POINT(#{lng} #{lat})"
  end
end