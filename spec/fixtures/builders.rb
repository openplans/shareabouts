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
  
  
end

# Fixjour.verify!