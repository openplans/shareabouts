/*globals jQuery _ Handlebars Backbone */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.AuthNavView = Backbone.View.extend({
    events: {
      'click .internal-menu-item a': 'onLinkClick',
      'click #nav-btn': 'onMobileNavClick',
      'click #sign-in-btn': 'onAuthNavClick'
    },

    render: function() {
      var data = this.getCurrentUser(),
          template = Handlebars.templates['auth-nav'](data);
      this.$el.html(template);

      return this;
    },

    getCurrentUser: function() {
      return S.bootstrapped && S.bootstrapped.currentUser;
    },

    onLinkClick: function(evt) {
      evt.preventDefault();
      // Hide mobile list when one is selected
      $('.access').removeClass('is-exposed');
      // Load the content
      this.options.router.navigate(evt.target.getAttribute('href'), {trigger: true});
    },

    onMobileNavClick: function(evt) {
      evt.preventDefault();
      $('.access').toggleClass('is-exposed');
    },

    onAuthNavClick: function(evt) {
      evt.preventDefault();
      $('.sign-in-menu').toggleClass('is-exposed');
      S.Util.log('USER', 'page-menu', ($('.sign-in-menu').hasClass('is-exposed') ? 'show' : 'hide') + '-auth');
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
