require 'spec_helper'

describe Comment do
  it { should belong_to(:commentable) }
  it { should belong_to(:profile) }
  it { should have_many(:activity_items) }
  
  it { should validate_presence_of(:commentable) }
  it { should validate_presence_of(:comment) }
end
