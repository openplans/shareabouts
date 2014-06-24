/*globals L Backbone _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.GeocodeAddressView = Backbone.View.extend({
    events: {
      'submit .geocode-address-form': 'onGeocodeAddress'
    },
    initialize: function() {

      // Add class to the body to for geocoding layout
      $('body').addClass('geocoding-enabled');

    },
    render: function() {
      var data = this.options.mapConfig;
      this.$el.html(Handlebars.templates['geocode-address'](data));
      return this;
    },
    onGeocodeAddress: function(evt) {
      evt.preventDefault();
      var self = this,
          mapQuestKey = S.bootstrapped.mapQuestKey,
          $address = this.$('.geocode-address-field'),
          address = $address.val();

      S.Util.MapQuest.geocode(address, {
        success: function(data) {
          var locationsData = data.results[0].locations;

          console.log('Geocoded data: ', data);
          if (locationsData.length > 0) {
            // TODO: This might make more sense if the view itself was the
            //       event's target.
            $(S).trigger('geocode', [locationsData[0]]);
          } else {
            // TODO: Show some feedback that we couldn't geocode.
            console.error('Woah, no location found for ', data.results[0].providedLocation.location);
          }
        },
        error: function() {
          console.error('There was an error while geocoding: ', arguments);
        }
      });

      S.Util.log('USER', 'chicago', 'geocode-address', address);
    },
    setAddress: function(location) {
      var $address = this.$('.geocode-address-field');
      $address.val(location);
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
