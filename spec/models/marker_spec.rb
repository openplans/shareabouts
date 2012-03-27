require 'spec_helper'

describe Marker do
  it { should belong_to(:location_type) }
  
  it { should validate_presence_of(:location_type) }
  it { should validate_presence_of(:icon_width) }
  it { should validate_presence_of(:icon_height) }
  it { should validate_presence_of(:icon_anchor_x) }
  it { should validate_presence_of(:icon_anchor_y) }
  it { should validate_presence_of(:popup_anchor_x) }
  it { should validate_presence_of(:popup_anchor_y) }
end
