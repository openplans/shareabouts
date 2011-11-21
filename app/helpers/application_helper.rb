module ApplicationHelper

  def supported?(supportable)
    if current_user
      current_user.votes.where(:supportable_type => supportable.class.to_s, :supportable_id => supportable.id).count > 0
    end
  end
  
  def supportable_votes_path(supportable)
    send "#{supportable.class.to_s.underscore}_votes_path", supportable.id
  end
  
  def commentable_comments_path(commentable)
    send "#{commentable.class.to_s.underscore}_comments_path", commentable.id
  end
end
