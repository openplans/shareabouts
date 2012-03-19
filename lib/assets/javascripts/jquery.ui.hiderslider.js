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
        '<div class="ui-sliderhider-icon"></div>' +
        '<div class="ui-sliderhider-content">' +
          '<div class="ui-sliderhider-slider"></div>' +
        '</div>' +
        '<div class="ui-sliderhider-title">'+o.title+'</div>' +
        '<div class="ui-sliderhider-close">X</div>' +
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
      var $content = $('.ui-sliderhider-content', self.element),
          $slider = $('.ui-sliderhider-slider', self.element),
          $close = $('.ui-sliderhider-close', self.element);

      if ($content.width() > 1) {
        $content.animate({width: '1px'}, function(){
          $close.hide();
        });
      } else {
        $content.animate({width: ($slider.width() + parseInt($slider.css('marginRight'), 10)+ parseInt($slider.css('marginLeft'), 10)) + 'px'});
        $close.show();
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