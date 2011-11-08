class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :set_locale
  
  def set_locale
    I18n.locale = env['rack.locale'] || I18n.default_locale
  end
end
