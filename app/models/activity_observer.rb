# The ActivityObserver observes certain models for, at the moment, creation of 
# new records, and then creates a new ActivityItem for those records. 
# Read about ActiveRecord Observers here:
# http://api.rubyonrails.org/classes/ActiveRecord/Observer.html

class ActivityObserver < ActiveRecord::Observer
  observe FeaturePoint, Comment, Vote
  
  def after_create(observed)
    if observed.is_a?(Vote)
      # Don't create activity items for anonymous votes or vote votes for own submission
      return true if observed.user.nil? || observed.user == observed.supportable.user
    end
    
    parent = if observed.respond_to?(:commentable)
      observed.commentable
    elsif observed.respond_to?(:supportable)
      observed.supportable
    end
    
    user_name = observed.respond_to?(:display_submitter) ? observed.display_submitter : observed.profile.try(:name)
    
    ActivityItem.create({
      :subject        => observed, 
      :profile        => observed.profile,
      :user_name      => user_name,
      :subject_parent => parent
    })
  end
end
