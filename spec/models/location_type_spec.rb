require 'spec_helper'

describe LocationType do
  it { should have_many(:feature_location_types) }
  it { should have_many(:feature_points) }
  
  it { should validate_presence_of(:name) }
end
