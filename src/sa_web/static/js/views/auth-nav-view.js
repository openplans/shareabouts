/*globals jQuery _ Handlebars Backbone */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.AuthNavView = Backbone.View.extend({
    events: {
      'click .internal-menu-item a': 'onLinkClick',
      'click #nav-bttn': 'onMobileNavClick'
    },

    render: function() {
      var data = S.bootstrapped.currentUser,
          template = Handlebars.templates['auth-nav'](data);
      this.$el.html(template);

      return this;
    },

    onLinkClick: function(evt) {
      evt.preventDefault();
      // Hide mobile list when one is selected
      $('.access').removeClass('expose');
      // Load the content
      this.options.router.navigate(evt.target.getAttribute('href'), {trigger: true});
    },

    onMobileNavClick: function(evt) {
      evt.preventDefault();
      $('.access').toggleClass('expose');
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
