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

      // Manually set the width on inner to keep floated elements from jumping
      $inner = $('.ui-sliderhider-inner');
      $inner.width($inner.outerWidth());

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
      $('.ui-sliderhider-content', self.element).animate({width: 'toggle'});
    },

    destroy: function() {
      this.element.empty();
    }
  });
})(jQuery);