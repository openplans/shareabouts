(function($) {
  $.widget("ui.hiderslider", {
    options: {
      title: 'HiderSlider'
    },

    _create: function() {
      var self = this,
          o = self.options,
          el = self.element,
          $inner;

      // Append markup
      $(el).append('<div class="ui-sliderhider-container">' +
        '<div class="ui-sliderhider-title">'+o.title+'</div>' +
        '<div class="ui-sliderhider-content">' +
          '<div class="ui-sliderhider-inner">' +
            '<div class="ui-sliderhider-slider"></div>' +
            '<div class="ui-sliderhider-close">X</div>' +
          '</div>' +
        '</div>' +
      '</div>');

      // Init slider
      $('.ui-sliderhider-slider', el).slider(o.slider);

      // Toggle visibility when you click the title
      $('.ui-sliderhider-title').click(function(){
        self.toggleVisiblity();
      });

      // Toggle visibility when you click the close link
      $('.ui-sliderhider-close').click(function(){
        self.toggleVisiblity();
      });
    },

    // Toggle visiblity
    toggleVisiblity: function() {
      // This is a hackier way of doing: $content.animate({width: 'toggle'});
      // thanks to a flickering problem in Chrome
      // http://stackoverflow.com/questions/8167193/small-widths-in-chrome
      var $content = $('.ui-sliderhider-content', self.element);

      if ($content.width() > 1) {
        $content.animate({width: '1px'}, function(){
          $('.ui-sliderhider-close', $content).hide();
        });
      } else {
        $content.animate({width: $('.ui-sliderhider-inner').width() + 'px'});
        $('.ui-sliderhider-close', $content).show();
      }
    },

    // Reset filtering
    reset: function() {
      $('.ui-sliderhider-slider', this.element).slider('value', 0);
    },

    destroy: function() {
      this.element.empty();
    }
  });
})(jQuery);