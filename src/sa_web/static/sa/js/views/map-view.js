var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.MapView = Backbone.View.extend({
    initialize: function() {
      var self = this,
          i, layerModel,
          // Base layer config is optional, default to Mapbox Streets
          baseLayerConfig = _.extend({
            url: 'http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors, CC-BY-SA. <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
          }, self.options.mapConfig.base_layer),
          baseLayer = L.tileLayer(baseLayerConfig.url, baseLayerConfig);

      // Init the map
      self.map = L.map(self.el, self.options.mapConfig.options);
      self.placeLayers = L.layerGroup();
      self.map.addLayer(baseLayer);

      // Remove default prefix
      self.map.attributionControl.setPrefix('');

      _.each(self.options.mapConfig.layers, function(layerConfig){
        var layer = L.tileLayer(layerConfig.url, layerConfig);
        self.map.addLayer(layer);
      });

      self.map.addLayer(self.placeLayers);

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
        placeTypes: this.options.placeTypes
      });
    },
    removeLayerView: function(model) {
      this.layerViews[model.cid].remove();
      delete this.layerViews[model.cid];
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);