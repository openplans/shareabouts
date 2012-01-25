class ActivityObserver < ActiveRecord::Observer
  observe FeaturePoint, Comment, Vote
  
  def after_create(observed)
    parent = if observed.respond_to?(:commentable)
      observed.commentable
    elsif observed.respond_to?(:supportable)
      observed.supportable
    end
    
    user_name = observed.respond_to?(:display_submitter) ? observed.display_submitter : observed.user.try(:name)
    
    ActivityItem.create({
      :subject        => observed, 
      :user           => observed.user,
      :user_name      => user_name,
      :subject_parent => parent
    })
  end
end
