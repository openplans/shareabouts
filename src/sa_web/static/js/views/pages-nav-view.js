/*globals jQuery _ Handlebars Backbone */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PagesNavView = Backbone.View.extend({
    events: {
      'click .internal-menu-item a': 'onPageLinkClick',
      'click #nav-btn': 'onMobileNavClick',
      'click #sign-in-btn': 'onAuthNavClick'
    },

    render: function() {
      var data = {
            pages: this.options.pagesConfig,
            has_pages: (this.options.pagesConfig.length > 0)
          },
          template = Handlebars.templates['pages-nav'](data);
      this.$el.html(template);

      return this;
    },

    onPageLinkClick: function(evt) {
      evt.preventDefault();
      // Hide mobile list when one is selected
      $('.access').removeClass('expose');
      // Load the content
      this.options.router.navigate(evt.target.getAttribute('href'), {trigger: true});
    },

    onMobileNavClick: function(evt) {
      evt.preventDefault();
      $('.access').toggleClass('expose');
    },

    onAuthNavClick: function(evt) {
      evt.preventDefault();
      $('.sign-in-menu').toggleClass('expose');
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
