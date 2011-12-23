require 'fixjour'
require 'faker'
require "#{::Rails.root}/spec/fixtures/staten_island_coordinates"

# Default point lies in staten island, default region outlines staten island

Fixjour :verify => false do
  define_builder(FeaturePoint) do |klass, overrides|    
    klass.new({
      :the_geom => Point.from_x_y(-74.10003662109374, 40.625939917833925, 4326)
    })
  end
  
  define_builder(Vote) do |klass, overrides|
    klass.new({
      :supportable => new_feature_point
    })
  end
  
  define_builder(Comment) do |klass, overrides|
    klass.new({
      :commentable => new_feature_point,
      :comment => Faker::Lorem.sentences
    })
  end
  
  define_builder(Region) do |klass, overrides|
    klass.new({
      :the_geom => MultiPolygon.from_coordinates( StatenIslandCoordinates, 4326 ),
      :name     => Faker::Lorem.words,
      :kind     => Faker::Lorem.words(1)
    })
  end
  
  define_builder(FeatureRegion) do |klass, overrides|
    
    klass.new({
      :feature => new_feature_point, 
      :region  => new_region
    })
  end
  
  define_builder(User) do |klass, overrides|
    klass.new({
      :email => Faker::Internet.email
    })
  end
  
  define_builder(Admin) do |klass, overrides|
    klass.new({
      :email => Faker::Internet.email, 
      :password => 'password', 
      :password_confirmation => 'password',
      :level => 100
    })
  end
  
  define_builder(LocationType) do |klass, overrides|
    klass.new({
      :name => Faker::Lorem.words(1)
    })
  end
  
  define_builder(FeatureLocationType) do |klass, overrides|
    klass.new({
      :feature => new_feature_point,
      :location_type => new_location_type
    })
  end
  
  define_builder(Page) do |klass, overrides|
    klass.new({
      :author => create_admin,
      :title => Faker::Lorem.sentence,
      :slug => Faker::Internet.domain_word,
      :status => Page::StatusOptions.first
    })
  end
end

# Fixjour.verify!