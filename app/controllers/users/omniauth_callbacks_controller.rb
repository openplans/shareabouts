class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

  def facebook
    @user              = User.find_for_facebook_oauth(request.env["omniauth.auth"], current_user)
    session[:fb_token] = request.env["omniauth.auth"]['credentials']['token']
    
    if @user.persisted?
      sign_in_and_redirect @user, :event => :authentication
    else
      session["devise.facebook_data"] = request.env["omniauth.auth"]
      redirect_to new_user_registration_url # does this ever happen?
    end
  end
    
  def twitter
    @user = User.find_for_twitter_oauth(request.env["omniauth.auth"], current_user)

    session[:twitter_token]  = request.env["omniauth.auth"]['credentials']['token']
    session[:twitter_secret] = request.env["omniauth.auth"]['credentials']['secret']
    
    if @user.persisted?
      sign_in_and_redirect @user, :event => :authentication
    else
      session["devise.twitter_data"] = request.env["omniauth.auth"]
      redirect_to new_user_registration_url
    end
  end

end