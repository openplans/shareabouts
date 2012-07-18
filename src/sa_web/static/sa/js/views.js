var Shareabouts = Shareabouts || {};

(function(S, $){
  // Copy and paste me to start a new view
  // S.View = Backbone.View.extend({
  //   initialize: function(){},
  //   render: function(){}
  // });

  S.LayerView = Backbone.View.extend({
    initialize: function(){
      this.model.on('change', this.updateLayer, this);
      this.initLayer();
    },
    initLayer: function() {
      this.latLng = new L.LatLng(this.model.get('lat'), this.model.get('lng'));
      this.layer = new L.Marker(this.latLng);
      this.render();
    },
    updateLayer: function() {
      if (this.layer) {
        this.hide();
      }
      this.initLayer();
    },
    render: function() {
      var mapBounds = this.options.map.getBounds();
      if (mapBounds.contains(this.latLng)) {
        this.show();
      } else {
        this.hide();
      }
    },
    show: function() {
      this.options.placeLayers.addLayer(this.layer);
    },
    hide: function() {
      this.options.placeLayers.removeLayer(this.layer);
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
      self.map.setView(new L.LatLng(self.options.lat, self.options.lng), self.options.zoom);

      self.map.on('dragend', self.onDragEnd, self);

      // Bind data events
      self.collection.on('reset', self.render, self);
      self.collection.on('add', self.addLayerView, self);

      self.collection.fetch();
    },
    render: function() {
      var self = this;

      // Clear any existing stuff on the map, and free any views in
      // the list of layer views.
      this.placeLayers.clearLayers();
      this.layerViews = [];

      this.collection.each(function(model, i) {
        self.addLayerView(model);
      });
    },
    addLayerView: function(model) {
      this.layerViews.push(new S.LayerView({
        model: model,
        map: this.map,
        placeLayers: this.placeLayers
      }));
    },
    onDragEnd: function() {
      _.each(this.layerViews, function(view, i) {
        view.render();
      });
    }
  });
})(Shareabouts, jQuery);