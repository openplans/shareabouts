/*globals L Backbone _ jQuery */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.LayerView = Backbone.View.extend({
     // A view responsible for the representation of a place on the map.
    initialize: function(){
      this.map = this.options.map;

      // A throttled version of the render function
      this.throttledRender = _.throttle(this.render, 300);

      // Bind model events
      this.model.on('change', this.updateLayer, this);
      this.model.on('focus', this.focus, this);
      this.model.on('unfocus', this.unfocus, this);

      this.map.on('zoomend', this.updateLayer, this);

      // On map move, adjust the visibility of the markers for max efficiency
      this.map.on('move', this.throttledRender, this);

      this.initLayer();
    },
    initLayer: function() {
      var geom, context;

      // Handle if an existing place type does not match the list of available
      // place types.
      this.placeType = this.options.placeTypes[this.model.get('location_type')];
      if (!this.placeType) {
        console.warn('Place type', this.model.get('location_type'),
          'is not configured so it will not appear on the map.');
        return;
      }

      // Don't draw new places. They are shown by the centerpoint in the app view
      if (!this.model.isNew()) {
        geom = this.model.get('geometry');
        context = _.extend({}, this.model.toJSON(), {map: {zoom: this.map.getZoom()}});
        this.styleRule = L.Argo.getStyleRule(context, this.placeType.rules);

        if (geom.type === 'Point') {
          this.latLng = L.latLng(geom.coordinates[1], geom.coordinates[0]);
          if (this.hasIconForState()) {
            this.layer = this.isFocused ?
              L.marker(this.latLng, {icon: L.icon(this.styleRule.focus_icon)}) :
              L.marker(this.latLng, {icon: L.icon(this.styleRule.icon)});
          } else if (this.hasStyle()) {
            this.layer = this.isFocused ?
              L.circleMarker(this.latLng, this.styleRule.focus_style) :
              L.circleMarker(this.latLng, this.styleRule.style);
          }
        } else {
          this.layer = L.GeoJSON.geometryToLayer(geom);
          this.layer.setStyle(this.styleRule.style);
        }

        // Focus on the marker onclick
        if (this.layer) {
          this.layer.on('click', this.onMarkerClick, this);
        }

        this.render();
      }
    },
    updateLayer: function() {
      // Update the marker layer if the model changes and the layer exists
      this.removeLayer();
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
      } else {
        this.show();
      }
    },
    onMarkerClick: function() {
      S.Util.log('USER', 'map', 'place-marker-click', this.model.getLoggingDetails());
      this.options.router.navigate('/place/' + this.model.id, {trigger: true});
    },

    hasIcon: function() {
      var isPoint = this.model.get('geometry').type == 'Point';
      return isPoint && this.hasIconForState();
    },
    hasIconForState: function() {
      return this.styleRule &&
             ((!this.isFocused && this.styleRule.icon) ||
              (this.isFocused && this.styleRule.focus_icon));
    },
    hasStyle: function() {
      return this.styleRule &&
             ((!this.isFocused && this.styleRule.style) ||
              (this.isFocused && this.styleRule.focus_style));
    },

    focus: function() {
      if (!this.isFocused) {
        this.isFocused = true;
        this.updateLayer();
      }
    },
    unfocus: function() {
      if (this.isFocused) {
        this.isFocused = false;
        this.updateLayer();
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

}(Shareabouts, jQuery, Shareabouts.Util.console));