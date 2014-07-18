/*globals L Backbone _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.GeocodeAddressView = Backbone.View.extend({
    events: {
      'submit .geocode-address-form': 'onGeocodeAddress',
      'change .geocode-address-field': 'onAddressChange'
    },
    render: function() {
      var data = this.options.mapConfig;
      this.$el.html(Handlebars.templates['geocode-address'](data));
      return this;
    },
    onAddressChange: function(evt) {
      // .hide().addClass('is-hidden') is a bit redundant, but the .hide
      // is so that we can do a fade-in effect.
      this.$('.error').hide().addClass('is-hidden');
    },
    onGeocodeAddress: function(evt) {
      evt.preventDefault();
      var self = this,
          mapQuestKey = S.bootstrapped.mapQuestKey,
          $address = this.$('.geocode-address-field'),
          address = $address.val(),
          bounds = this.options.mapConfig.geocode_bounding_box;

      S.Util.MapQuest.geocode(address, bounds, {
        success: function(data) {
          var locationsData = data.results[0].locations;

          // console.log('Geocoded data: ', data);
          if (locationsData.length > 0) {
            // self.$('.error').hide().addClass('is-hidden');

            // TODO: This might make more sense if the view itself was the
            //       event's target.
            $(S).trigger('geocode', [locationsData[0]]);
          } else {
            // TODO: Show some feedback that we couldn't geocode.
            console.error('Woah, no location found for ', data.results[0].providedLocation.location, data);
            self.$('.error').removeClass('is-hidden').hide().fadeIn().html('Could not find that location.');
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
      $address.val(location).change();
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
