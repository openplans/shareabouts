/*globals L Backbone _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.MapView = Backbone.View.extend({
    events: {
      'click .locate-me': 'onClickGeolocate'
    },
    initialize: function() {
      var self = this,
          i, layerModel,
          logUserZoom = function() {
            S.Util.log('USER', 'map', 'zoom', self.map.getBounds().toBBoxString(), self.map.getZoom());
          },
          logUserPan = function(evt) {
            S.Util.log('USER', 'map', 'drag', self.map.getBounds().toBBoxString(), self.map.getZoom());
          };

      // Init the map
      self.map = L.map(self.el, self.options.mapConfig.options);
      self.placeLayers = L.layerGroup();

      // Add layers defined in the config file
      function addMapLayer(config) {
        var layer;

        // type is required by Argo for fetching data, so it's a pretty good
        // Argo indicator. Argo is this by the way: https://github.com/openplans/argo/
        if (config.type && config.type === 'mapbox') {
          if (!config.accessToken) { config.accessToken = S.bootstrapped.mapboxToken; }
          try {
            layer = L.mapboxGL(config)
            layer.addTo(self.map);
          } catch (error) {
            // If creation of the GL layer fails for any reason, we may have to
            // clean up.
            if (layer) {
              // The _glMap may never have been successfully set on the layer,
              // so we need to patch it.
              layer._glMap = {remove: function () {}};
              layer.removeFrom(self.map);
            }

            // Many users may fail because of lack of WebGL support. For that
            // case, provide a fallback set of tiles.
            if (config.fallback) {
              layer = addMapLayer(config.fallback);
            }
            else {
              throw error;
            }
          }
        } else if (config.type) {
          layer = L.argo(config.url, config).addTo(self.map);
        } else {
          // Assume a tile layer
          layer = L.tileLayer(config.url, config).addTo(self.map);
        }
        return layer;
      }

      _.each(self.options.mapConfig.layers, addMapLayer);

      // Remove default prefix
      self.map.attributionControl.setPrefix('');

      // Init geolocation
      if (self.options.mapConfig.geolocation_enabled) {
        self.initGeolocation();
      }

      if (self.options.mapConfig.geocoding_enabled) {
        self.initGeocoding();
      }

      self.map.addLayer(self.placeLayers);

      // Init the layer view cache
      this.layerViews = {};

      self.map.on('dragend', logUserPan);
      $(self.map.zoomControl._zoomInButton).click(logUserZoom);
      $(self.map.zoomControl._zoomOutButton).click(logUserZoom);

      self.map.on('zoomend', function(evt) {
        S.Util.log('APP', 'zoom', self.map.getZoom());
      });

      self.map.on('moveend', function(evt) {
        S.Util.log('APP', 'center-lat', self.map.getCenter().lat);
        S.Util.log('APP', 'center-lng', self.map.getCenter().lng);

        $(S).trigger('mapmoveend', [evt]);
      });

      self.map.on('dragend', function(evt) {
        $(S).trigger('mapdragend', [evt]);
      });

      // Bind data events
      self.collection.on('reset', self.render, self);
      self.collection.on('add', self.addLayerView, self);
      self.collection.on('remove', self.removeLayerView, self);
    },
    reverseGeocodeMapCenter: _.debounce(function() {
      var center = this.map.getCenter();
      var geocodingEngine = this.options.mapConfig.geocoding_engine || 'MapQuest';

      S.Util[geocodingEngine].reverseGeocode(center, {
        success: function(data) {
          var locationData = S.Util[geocodingEngine].getLocation(data);
          // S.Util.console.log('Reverse geocoded center: ', data);
          $(S).trigger('reversegeocode', [locationData]);
        }
      });
    }, 1000),
    render: function() {
      var self = this;

      // Clear any existing stuff on the map, and free any views in
      // the list of layer views.
      this.placeLayers.clearLayers();
      this.layerViews = {};

      this.collection.each(function(model, i) {
        self.addLayerView(model);
      });
    },
    initGeolocation: function() {
      var self = this;

      var onLocationError = function(evt) {
        var message;
        switch (evt.code) {
          // Unknown
          case 0:
            message = 'An unknown error occured while locating your position. Please try again.';
            break;
          // Permission Denied
          case 1:
            message = 'Geolocation is disabled for this page. Please adjust your browser settings.';
            break;
          // Position Unavailable
          case 2:
            message = 'Your location could not be determined. Please try again.';
            break;
          // Timeout
          case 3:
            message = 'It took too long to determine your location. Please try again.';
            break;
        }
        alert(message);
      };

      var onLocationFound = function(evt) {
        var msg;
        if(!self.map.options.maxBounds ||self.map.options.maxBounds.contains(evt.latlng)) {
          self.map.fitBounds(evt.bounds);
        } else {
          msg = 'It looks like you\'re not in a place where we\'re collecting ' +
            'data. I\'m going to leave the map where it is, okay?';
          alert(msg);
        }
      };

      // Add the geolocation control link
      this.$('.leaflet-top.leaflet-right').append(
        '<div class="leaflet-control leaflet-bar">' +
          '<a href="#" class="locate-me"></a>' +
        '</div>'
      );

      // Bind event handling
      this.map.on('locationerror', onLocationError);
      this.map.on('locationfound', onLocationFound);

      // Go to the current location if specified
      if (this.options.mapConfig.geolocation_onload) {
        this.geolocate();
      }
    },
    initGeocoding: function() {
      var geocoder;
      var control;
      var options = {
          collapsed: false,
          position: 'topright',
          defaultMarkGeocode: false,
          geocoder: geocoder
        };

      switch (this.options.mapConfig.geocoding_engine) {
        case 'Mapbox':
          options.geocoder = L.Control.Geocoder.mapbox(S.bootstrapped.mapboxToken);
          break;

        default:
          options.geocoder = L.Control.Geocoder.mapQuest(S.bootstrapped.mapQuestKey);
          break;
      }

      if (this.options.mapConfig.geocode_field_label) {
        options.placeholder = this.options.mapConfig.geocode_field_label
      }

      control = L.Control.geocoder(options)
        .on('markgeocode', function(evt) {
          result = evt.geocode || evt;
          this._map.fitBounds(result.bbox);
          $(S).trigger('geocode', [evt]);
        })
        .addTo(this.map);

      // Move the control to the center
      $('<div class="leaflet-top leaflet-center"/>')
        .insertAfter($('.leaflet-top.leaflet-left'))
        .append($(control._container))

      Shareabouts.geocoderControl = control;
    },
    onClickGeolocate: function(evt) {
      evt.preventDefault();
      S.Util.log('USER', 'map', 'geolocate', this.map.getBounds().toBBoxString(), this.map.getZoom());
      this.geolocate();
    },
    geolocate: function() {
      this.map.locate();
    },
    addLayerView: function(model) {
      this.layerViews[model.cid] = new S.LayerView({
        model: model,
        router: this.options.router,
        map: this.map,
        placeLayers: this.placeLayers,
        placeTypes: this.options.placeTypes,
        mapView: this
      });
    },
    removeLayerView: function(model) {
      this.layerViews[model.cid].remove();
      delete this.layerViews[model.cid];
    },
    zoomInOn: function(latLng) {
      this.map.setView(latLng, this.options.mapConfig.options.maxZoom || 17);
    },

    filter: function(locationType) {
      var self = this;
      console.log('filter the map', arguments);
      this.locationTypeFilter = locationType;
      this.collection.each(function(model) {
        var modelLocationType = model.get('location_type');

        if (modelLocationType &&
            modelLocationType.toUpperCase() === locationType.toUpperCase()) {
          self.layerViews[model.cid].show();
        } else {
          self.layerViews[model.cid].hide();
        }
      });
    },

    clearFilter: function() {
      var self = this;
      this.locationTypeFilter = null;
      this.collection.each(function(model) {
        self.layerViews[model.cid].render();
      });
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
