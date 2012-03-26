require 'spec_helper'

describe Profile do
  attr_reader :profile
  
  before do
    @profile = create_profile
  end
  
  it { should belong_to(:user) }
  it { should have_many(:activity_items) }
  it { should have_many(:comments) }
  it { should have_many(:feature_points) }
  it { should have_many(:feature_polygons) }
  it { should have_many(:votes) }
  
  it { should validate_uniqueness_of(:user_agent, :scoped_to => :client_ip) }
  it { should validate_uniqueness_of(:user_id) }
end
