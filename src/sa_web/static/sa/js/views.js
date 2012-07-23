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
      var app = this.options.router.appView,
          router = this.options.router,
          model = this.model;

      evt.preventDefault();
      this.model.save(this.getAttrs(), {
        success: function() {
          app.hideNewPin();
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

      this.model.on('change', this.updateLayer, this);
      this.model.on('focus', this.focus, this);
      this.model.on('unfocus', this.unfocus, this);
      this.model.on('destroy', this.destroy, this);

      this.map.on('dragend', this.render, this);

      this.initLayer();
    },
    initLayer: function() {
      var location;
      if (!this.model.isNew()) {
        location = this.model.get('location');
        this.latLng = new L.LatLng(location.lat, location.lng);
        this.layer = new L.Marker(this.latLng);
        this.render();
      }
    },
    updateLayer: function() {
      if (this.layer) {
        this.removeLayer();
      }
      this.initLayer();
    },
    removeLayer: function() {
      if (this.layer) {
        this.options.placeLayers.removeLayer(this.layer);
      }
    },
    render: function() {
      var mapBounds = this.map.getBounds();

      if (this.latLng) {
        if (mapBounds.contains(this.latLng)) {
          this.show();
        } else {
          this.hide();
        }
      }
    },
    focus: function() {
      // TODO turn the icon red if not new
    },
    unfocus: function() {
      // TODO turn the icon blue
    },
    destroy: function() {
      this.removeLayer();
      this.map.off('dragend', this.render, this);
    },
    setIcon: function() {

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
        map: this.map,
        placeLayers: this.placeLayers
      });
    },
    removeLayerView: function(model) {
      delete this.layerViews[model.cid];
    }
  });
})(Shareabouts, jQuery);
