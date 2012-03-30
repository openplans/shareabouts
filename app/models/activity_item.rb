# ActivityItems are created after certain actions are taken on the site, such 
# as a new location was added or a comment was made. ActivityItems appear in
# the activity ticker. 
# The ActivityObserver handles the creation of ActivityItems.

class ActivityItem < ActiveRecord::Base
  belongs_to :subject, :polymorphic => true, :inverse_of => :activity_items
  belongs_to :subject_parent, :polymorphic => true
  belongs_to :profile
  
  validates :subject, :presence => true
  
  def user
    profile.user if profile.present?
  end
  
  def user_name
    read_attribute(:user_name) || User.model_name.human.capitalize
  end
  
  def description
    if subject_parent.present?
      I18n.t "activity.point.by_name", :name => subject_parent.display_submitter
    end
  end
  
  def feature
    subject_parent || subject
  end
  
  def region
    feature.region
  end
end
