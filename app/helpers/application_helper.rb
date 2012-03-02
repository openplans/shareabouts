module ApplicationHelper

  def vote_for(supportable)
    if current_user
      current_user.votes.where(:supportable_type => supportable.class.to_s, :supportable_id => supportable.id).first
    else
      return false if cookies[:supportable].inspect == "nil"
      
      supported   = Marshal.load(cookies[:supportable])
      key         = supportable.class.to_s.to_sym
      
      Vote.find(supported[key][supportable.id]) if supported.key?(key) && supported[key][supportable.id]
    end
  end
  
  def supportable_votes_path(supportable)
    send "#{supportable.class.to_s.underscore}_votes_path", supportable.id
  end
  
  def commentable_comments_path(commentable)
    send "#{commentable.class.to_s.underscore}_comments_path", commentable.id
  end
  
  def list_friends
    # Friends from other services are grabbed every new session
    if session[:fb_token].present?
      session[:fb_friends] ||= fb_friends_hash session[:fb_token] 
      session[:fb_friends].map {|id,name| name}.join ", "
    elsif session[:twitter_token].present?
      session[:twitter_friends] ||= twitter_friends_hash session[:twitter_token], session[:twitter_secret]
      session[:twitter_friends].map {|id,name| name}.join ", "
    end
  end
  
  def tweet(message)
    link_to "tweet", "https://twitter.com/intent/tweet?source=webclient&text=#{message}", :class => "twitter"
  end
  
  # message is irrelevant for this
  def facebook_share_feature(feature)
    link_to "recommend on fb", "https://www.facebook.com/sharer/sharer.php?u=#{feature_point_url(feature)}", :class => "facebook"
  end
  
  def page_link_attributes(page)
    page.welcome_page? ? {'data-welcome-page' => true} : {}
  end
  
  def avatar_for(user)
    if user.facebook_id.present?
      image_tag "https://graph.facebook.com/#{user.facebook_id}/picture" 
    elsif user.twitter_id.present?
      image_tag "https://api.twitter.com/1/users/profile_image?id=#{user.twitter_id}"
    end
  end
  
  private
  
  def fb_friends_hash(access_token)
    friends_graph = FGraph.me('friends', :access_token => access_token)
    return {} if friends_graph.blank?
        
    User.where("facebook_id in (#{friends_graph.map { |h| h["id"] }.join(",")})").inject({}) do |memo, user|
      memo[user.id] = user.name
      memo
    end
  end
  
  def twitter_friends_hash(access_token, secret)
    twitter_client = Twitter::Client.new(
      :oauth_token => access_token,
      :oauth_token_secret => secret
    )
    
    friend_ids = twitter_client.friend_ids["ids"]
    return {} if friend_ids.blank?
        
    User.where("twitter_id in (#{friend_ids.join(",")})").inject({}) do |memo, user|
      memo[user.id] = user.name
      memo
    end
  end
end
