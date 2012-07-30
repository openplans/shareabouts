var Shareabouts = Shareabouts || {};

(function(S, $){
  S.LayerView = Backbone.View.extend({
    /*
     * A view responsible for the representation of a place on the map.
     */

    initialize: function(){
      this.map = this.options.map;
      this.throttledRender = _.throttle(this.render, 300);

      this.model.on('change', this.updateLayer, this);
      this.model.on('focus', this.focus, this);
      this.model.on('unfocus', this.unfocus, this);

      this.map.on('move', this.throttledRender, this);

      this.initLayer();
    },
    initLayer: function() {
      var location;

      this.placeType = this.options.placeTypes[this.model.get('location_type')];

      if (!this.placeType) {
        console.warn('Place type', this.model.get('location_type'),
          'is not configured so it will not appear on the map.');
        return;
      }

      if (!this.model.isNew()) {
        location = this.model.get('location');
        this.latLng = new L.LatLng(location.lat, location.lng);

        this.layer = new L.Marker(this.latLng, {icon: this.placeType['default']});

        // Focus on the marker onclick
        this.layer.on('click', this.onMarkerClick, this);

        this.render();
      }
    },
    updateLayer: function() {
      // Update the marker layer if the model changes and the layer exists
      if (this.layer) {
        this.layer.setLatLng(new L.LatLng(this.model.get('location').lat,
                                          this.model.get('location').lng));
      }
      this.initLayer();
    },
    removeLayer: function() {
      if (this.layer) {
        this.options.placeLayers.removeLayer(this.layer);
      }
    },
    render: function() {
      // Show if it is within the current map bounds
      var mapBounds = this.map.getBounds();

      if (this.latLng) {
        if (mapBounds.contains(this.latLng)) {
          this.show();
        } else {
          this.hide();
        }
      }
    },
    onMarkerClick: function() {
      this.options.router.navigate('/place/' + this.model.id, {trigger: true});
    },
    focus: function() {
      if (this.placeType) {
        this.setIcon(this.placeType.focused);
      }
    },
    unfocus: function() {
      if (this.placeType) {
        this.setIcon(this.placeType['default']);
      }
    },
    remove: function() {
      this.removeLayer();
      this.map.off('move', this.throttledRender, this);
    },
    setIcon: function(icon) {
      if (this.layer) {
        this.layer.setIcon(icon);
      }
    },
    show: function() {
      if (this.layer) {
        this.options.placeLayers.addLayer(this.layer);
      }
    },
    hide: function() {
      this.removeLayer();
    }
  });

})(Shareabouts, jQuery);