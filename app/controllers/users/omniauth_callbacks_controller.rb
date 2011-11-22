class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

  def facebook
    @user              = User.find_for_facebook_oauth(request.env["omniauth.auth"], current_user)
    session[:fb_token] = request.env["omniauth.auth"]['credentials']['token']
    
    if @user.persisted?
      flash[:notice] = I18n.t "devise.omniauth_callbacks.success", :kind => "Facebook"
      sign_in_and_redirect @user, :event => :authentication
    else
      session["devise.facebook_data"] = request.env["omniauth.auth"]
      redirect_to new_user_registration_url
    end
  end

end