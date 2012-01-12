class ActivityObserver < ActiveRecord::Observer
  observe FeaturePoint, Comment, Vote
  
  def after_create(observed)
    parent = if observed.respond_to?(:commentable)
      observed.commentable
    elsif observed.respond_to?(:supportable)
      observed.supportable
    end
    
    ActivityItem.create({
      :subject        => observed, 
      :user           => observed.user,
      :user_name      => observed.user.try(:name),
      :subject_parent => parent
    })
  end
end
