# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
require 'cover_me'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'rspec/autorun'
require File.expand_path(File.dirname(__FILE__) + "/fixtures/builders.rb")
require 'spatial_adapter/postgresql'
require "#{::Rails.root}/spec/fixtures/staten_island_coordinates"

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.mock_with :rspec

  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # If true, the base class of anonymous controllers will be inferred
  # automatically. This will be the default behavior in future versions of
  # rspec-rails.
  config.infer_base_class_for_anonymous_controllers = false
  
  config.include(Fixjour)
end

# Fixing the SRID constraint
ActiveRecord::Base.connection.execute("ALTER TABLE feature_points DROP CONSTRAINT \"enforce_srid_the_geom\" RESTRICT")
ActiveRecord::Base.connection.execute("UPDATE feature_points SET the_geom = SETSRID (the_geom, 4326)")
ActiveRecord::Base.connection.execute("ALTER TABLE regions DROP CONSTRAINT \"enforce_srid_the_geom\" RESTRICT")
ActiveRecord::Base.connection.execute("UPDATE regions SET the_geom = SETSRID (the_geom, 4326)")

def make_staten_island
  create_region :the_geom => MultiPolygon.from_coordinates(StatenIslandCoordinates, 4326)
end