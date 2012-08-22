var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PagesNavView = Backbone.View.extend({
    events: {
      'click a': 'onPageLinkClick'
    },

    render: function() {
      var $template = ich['pages-nav']({
        pages: this.options.pagesConfig
      });
      this.$el.html($template);

      return this;
    },

    onPageLinkClick: function(evt) {
      evt.preventDefault();
      this.options.router.navigate(evt.target.getAttribute('href'), {trigger: true});
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
