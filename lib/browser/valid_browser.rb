module ValidBrowser
  # Browser restrictor
  # 
  # You can choose whether to just display a warning,
  # or disable access completely.
  # 
  # You need to include ValidBrowser in application.rb
  # You also need to install the UserAgent plugin - http://github.com/josh/useragent
  # 
  # Example 1 - show warning:
  # # sessions/new.html.erb
  # <%- unless valid_browser? -%>
  #   <p>
  #     It looks like you're using an unsupported browser which means this service may not function properly.<br />
  #     We recommend the following browsers.
  #   </p>
  #   <ul>
  #     <li><a href="http://www.apple.com/safari/download/">Safari 3.1 or later</a> (Mac / PC)</li>
  #     <li><a href="http://www.mozilla.com/en-US/firefox/">Firefox 2 or later</a> (Mac / PC)</li>
  #   </ul>
  # <%- end -%>
  # 
  # Example 2 - restrict completely:
  # # application.rb
  # before_filter :restrict_browser
  # def restrict_browser
  #   unless valid_browser?
  #     render :action => '/path_to_template'
  #     return false
  #   end
  # end
  
  
  def self.included(base)
    base.class_eval do
      helper_method :valid_browser?
    end
  end
  
  Browser = Struct.new(:browser, :version)
  SupportedBrowsers = [
    Browser.new("Safari", "3"),
    Browser.new("Firefox", "3.6"),
    Browser.new("Internet Explorer", "7.0"),
    Browser.new("Chrome", "2"),
    Browser.new("Opera", "9.5"),
    Browser.new("Android", "1.0")
  ]

  protected
  
    def valid_browser?
      return true if request.user_agent.blank? || (user_agent = UserAgent.parse(request.user_agent)).version.blank?
      SupportedBrowsers.detect { |browser| user_agent >= browser }
    end
end