module ApplicationHelper

  def supported?(supportable)
    # if supported cookie contains this supportable type and id
    false
  end
  
  def supportable_votes_path(supportable)
    send "#{supportable.class.to_s.underscore}_votes_path", supportable.id
  end
  
  def commentable_comments_path(commentable)
    send "#{commentable.class.to_s.underscore}_comments_path", commentable.id
  end
end
