class ActivityObserver < ActiveRecord::Observer
  observe FeaturePoint, Comment, Vote
  
  def after_create(observed)
    ActivityItem.create({
      :subject   => observed, 
      :user      => observed.user,
      :user_name => observed.user.try(:name)
    })
  end
end
