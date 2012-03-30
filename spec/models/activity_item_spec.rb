require 'spec_helper'

describe ActivityItem do
  it { should belong_to(:subject) }
  it { should belong_to(:subject_parent) }
  it { should belong_to(:profile) }
  
  it { should validate_presence_of(:subject) }
end
