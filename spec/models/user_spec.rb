require 'spec_helper'

describe User do
  
  it { should have_many(:feature_points)}
  it { should have_many(:votes)}
  it { should have_many(:comments)}
  it { should have_one(:profile)}
end
