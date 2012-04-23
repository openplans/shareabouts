(function(S){
  S.PageLinks = function(o) {
    var options = $.extend({
          container: '#pages',
          pageList:  '#pages ul',
          pageLinks: '#pages a',
          preventWelcomePage: false,
          showPageCallback: function(data){
            $(S).trigger('refresh-popup', data.view);
          }
        }, o),
        $container = $(options.container),
        $pageList = $(options.pageList),
        $pageLinks = $(options.pageLinks),
        self = {};

    // Public Methods

    // Display static pages in the popup
    self.getPageContents = function(url, callback){
      $.get(url, callback, 'json');
    };

    self.toggleVisiblity = function(){
      $pageList.toggleClass('active');
    };

    self.hide = function(){
      $pageList.removeClass('active');
    };

    self.show = function(){
      $pageList.addClass('active');
    };

    // Bind Events

    // Toggle the mobile nav menu
    $container.click(function(){
      self.toggleVisiblity();
    });

    // Display static pages in the popup when a link is clicked
    $pageLinks.click(function(click){
      click.preventDefault();
      self.getPageContents($(click.target).attr('href'), options.showPageCallback);
    });

    // Show the welcome page on page load ONLY if not starting with a feature visible
    if ($pageLinks.is('[data-welcome-page]') && !options.preventWelcomePage) {
      self.getPageContents($pageLinks.filter('[data-welcome-page]').attr('href'), options.showPageCallback);
    }

    return self;
  };
})(Shareabouts);