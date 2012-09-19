var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PagesNavView = Backbone.View.extend({
    events: {
      'click .internal-menu-item a': 'onPageLinkClick',
      'click #nav-bttn': 'onMobileNavClick'
    },

    render: function() {
      var data = {
            pages: this.options.pagesConfig,
            has_pages: (this.options.pagesConfig.length > 0)
          },
          $template = ich['pages-nav'](data);
      this.$el.html($template);

      return this;
    },

    onPageLinkClick: function(evt) {
      evt.preventDefault();
      this.options.router.navigate(evt.target.getAttribute('href'), {trigger: true});
    },

    onMobileNavClick: function(evt) {
      evt.preventDefault();
      $('#access').toggleClass('expose');
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
