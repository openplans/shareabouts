/*globals L Backbone _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.GeocodeAddressView = Backbone.View.extend({
    events: {
      'submit .geocode-address-form': 'onGeocodeAddress'
    },
    initialize: function() {
      this.map = this.options.map;
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

      $.ajax({
        url: 'http://open.mapquestapi.com/geocoding/v1/address?key=' + mapQuestKey + '&location=' + address,
        success: function(data) {
          var locationsData = data.results[0].locations;

          console.log('Geocoded data: ', data);
          if (locationsData.length > 0) {
            self.setMapQuestGeocodedLocation(locationsData[0]);
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
    setMapQuestGeocodedLocation: function(locationData) {
      var location = this.getMapQuestLocationString(locationData);
      this.map.setView(locationData.latLng, 17);
    },
    getMapQuestLocationString: function(locationData) {
      if (locationData.geocodeQuality == 'ADDRESS') {
        return locationData.street + ', ' + locationData.adminArea5 + ' ' + locationData.adminArea3;
      }

      else {
        return '';
      }
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
