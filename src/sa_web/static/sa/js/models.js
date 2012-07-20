var Shareabouts = Shareabouts || {};

(function(S, $) {
  S.PlaceCollection = Backbone.Collection.extend({
    url: '/api/places/'
  });

})(Shareabouts, jQuery);