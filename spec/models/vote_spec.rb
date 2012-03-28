require 'spec_helper'

describe Vote do
  attr_reader :vote
  
  before do
    @vote = create_vote
  end
  
  it { should validate_presence_of(:supportable) }
  it { should belong_to(:profile)}
  it { should belong_to(:supportable)}
  it { should have_many(:activity_items)}
end
