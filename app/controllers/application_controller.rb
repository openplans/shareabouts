class ApplicationController < ActionController::Base
  include ValidBrowser
  
  protect_from_forgery
  before_filter :restrict_browser
  before_filter :set_locale
  before_filter :set_admin_current_admin
  
  def set_locale
    I18n.locale = env['rack.locale'] || I18n.default_locale
  end
  
  def authenticate_user!
    if !current_user
      # This should work, but session is lost. See https://github.com/plataformatec/devise/issues/1357
      # session[:return_to] = request.fullpath
      redirect_to user_omniauth_authorize_path(:google_apps, :origin => request.fullpath)
    end
  end   

  def after_sign_in_path_for(resource)
    # This should work, but session is lost. See https://github.com/plataformatec/devise/issues/1357
    # return_to = session[:return_to]
    # session[:return_to] = nil
    return_to = request.env['omniauth.origin']
    stored_location_for(resource) || return_to || root_path  
  end
  
  def find_or_create_profile
    @profile = current_profile || set_profile_cookie(Profile.create_by_request_fingerprint(request))
  end
  
  def current_profile
    @current_profile ||= if current_user.present?
      current_user.profile
    elsif cookies[:profile].inspect != "nil" # requires that we have set the profile cookie
      require 'profile'
      Marshal.load(cookies[:profile])
    else
      set_profile_cookie Profile.find_by_request_fingerprint(request)
    end
  end
  
  def current_ability
    # we only distinguish between admin and not admin. guests & users have equal abilities.
    @current_ability ||= Ability.new(current_admin) 
  end
  
  def set_cache_buster
    response.headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
  end
  
  def set_admin_current_admin
    Admin.current_admin = current_admin
  end
  
  def supported?(supportable)
    return false if cookies[:supportable].inspect == "nil"
    
    supported   = Marshal.load(cookies[:supportable])
    key         = supportable.class.to_s.to_sym
    
    supported.key?(key) && supported[key][supportable.id]
  end
  
  def restrict_browser
    unless valid_browser?
      render :template => 'home/no_ie6.html.erb', :layout => false
      return false
    end
  end
  
  private
  
  def store_vote_in_cookie(vote)
    supportable = vote.supportable
    supported   = cookies[:supportable].inspect != "nil" ? Marshal.load(cookies[:supportable]) : {}
    
    supportable_class = supportable.class.to_s.to_sym
        
    if supported[supportable_class].is_a?(Hash)
      supported[supportable_class][supportable.id] = vote.id
    else
      supported[supportable_class] = { supportable.id => vote.id }
    end
    
    cookies[:supportable] = { 
      :value => Marshal.dump(supported), 
      :expires => 4.years.from_now
    }
  end
  
  # Sets the profile in a cookie and returns the profile
  def set_profile_cookie(profile)
    cookies[:profile] = { 
      :value => Marshal.dump(profile), 
      :expires => 4.years.from_now
    }
    
    profile
  end
end
