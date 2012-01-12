class ActivityItem < ActiveRecord::Base
  belongs_to :subject, :polymorphic => true, :inverse_of => :activity_items
  belongs_to :subject_parent, :polymorphic => true
  belongs_to :user
  
  validates :subject, :presence => true
end
