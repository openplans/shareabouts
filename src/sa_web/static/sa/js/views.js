var Shareabouts = Shareabouts || {};

(function(S, $){
  // Copy and paste me to start a new view
  // S.View = Backbone.View.extend({
  //   initialize: function(){},
  //   render: function(){}
  // });

  S.PlaceDetailView = Backbone.View.extend({
    initialize: function() {
      this.model.on('change', this.onChange, this);
    },

    render: function() {
      this.$el.html(ich['place-detail'](this.model.toJSON()));
      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    }
  });

  S.PlaceFormView = Backbone.View.extend({
    /*
     * View responsible for the form for adding and editing places.
     */

    events: {
      'submit form': 'onSubmit'
    },
    initialize: function(){
      this.model.on('error', this.onError, this);
      this.model.on('change', this.onChange, this);
    },
    render: function(){
      this.$el.html(ich['place-form'](this.model.toJSON()));
      return this;
    },
    remove: function() {
      this.unbind();
    },
    onChange: function() {
      this.render();
    },
    onError: function(model, res) {
      // TODO
      console.log('oh no errors!!', model, res);
    },
    getAttrs: function() {
      var attrs = {},
          center = this.options.appView.getCenter();

      // Get values from the form
      _.each(self.$('form').serializeArray(), function(item, i) {
        attrs[item.name] = item.value;
      });

      // Get the location attributes from the map
      attrs.location = {
        lat: center.lat,
        lng: center.lng
      };

      return attrs;
    },
    onSubmit: function(evt) {
      var router = this.options.router,
          model = this.model;

      evt.preventDefault();
      this.model.save(this.getAttrs(), {
        success: function() {
          router.navigate('/place/' + model.id, {trigger: true});
        }
      });
    }
  });

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
      if (!this.model.isNew()) {
        location = this.model.get('location');
        this.latLng = new L.LatLng(location.lat, location.lng);
        this.layer = new L.Marker(this.latLng, {icon: this.options.icons.normal});

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

      console.log('render');
    },
    onMarkerClick: function() {
      this.options.router.navigate('/place/' + this.model.id, {trigger: true});
    },
    focus: function() {
      // TODO turn the icon red if not new
      this.setIcon(this.options.icons.focused);
    },
    unfocus: function() {
      // TODO turn the icon blue
      this.setIcon(this.options.icons.normal);
    },
    remove: function() {
      this.removeLayer();
      this.map.off('move', this.throttledRender, this);
    },
    setIcon: function(icon) {
      this.layer.setIcon(icon);
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

  S.MapView = Backbone.View.extend({
    initialize: function() {
      var self = this,
          i, layerModel,
          baseTileUrl = 'http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
          baseTileAttribution = 'Map data &copy; OpenStreetMap contributors, CC-BY-SA <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
          baseTile = new L.TileLayer(baseTileUrl, {maxZoom: 18, attribution: baseTileAttribution});

      // Init the map
      self.map = new L.Map(self.el);
      self.placeLayers = new L.LayerGroup();

      self.map.addLayer(baseTile);
      self.map.addLayer(self.placeLayers);
      self.map.setView(new L.LatLng(self.options.center.lat, self.options.center.lng), self.options.zoom);

      // Init the layer view cache
      this.layerViews = {};

      // Bind data events
      self.collection.on('reset', self.render, self);
      self.collection.on('add', self.addLayerView, self);
      self.collection.on('remove', self.removeLayerView, self);
    },
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
    addLayerView: function(model) {
      this.layerViews[model.cid] = new S.LayerView({
        model: model,
        router: this.options.router,
        map: this.map,
        placeLayers: this.placeLayers,
        icons: this.options.icons
      });
    },
    removeLayerView: function(model) {
      this.layerViews[model.cid].remove();
      delete this.layerViews[model.cid];
    }
  });
})(Shareabouts, jQuery);
