require 'fixjour'
require 'faker'

Fixjour :verify => false do
  define_builder(FeaturePoint) do |klass, overrides|
    x = overrides[:lng] || -74
    y = overrides[:lat] || 40
    point = Point.from_x_y x, y, 4326
    
    klass.new({
      :the_geom => point
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
    polygon = [[ Point.from_x_y( -74, 40, 4326 ), Point.from_x_y( -75, 41, 4326 ), Point.from_x_y( -75, 40, 4326 ) ]]
    
    klass.new({
      :the_geom => polygon, 
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
end

# Fixjour.verify!