require 'spec_helper'

describe Profile do
  attr_reader :profile
  
  before do
    @profile = create_profile
  end
  
  it { should belong_to(:user)}
  
  it { should validate_presence_of(:user) }
  it { should validate_uniqueness_of(:user_id) }
end
