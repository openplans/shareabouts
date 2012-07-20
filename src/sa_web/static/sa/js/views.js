var Shareabouts = Shareabouts || {};

(function(S, $){
  // Copy and paste me to start a new view
  // S.View = Backbone.View.extend({
  //   initialize: function(){},
  //   render: function(){}
  // });

  S.ContentView = Backbone.View.extend({
    /*
     * Base view for anything displayed in the side panel on the Shareabouts
     * map screen.
     */

    initialize: function() {
      this.$panelEl = $(this.options.panelEl);
      this.$crosshairEl = $(this.options.crosshairEl);
      this.$closeBtn = $(this.options.closeBtnEl);

      this.$closeBtn.click(_.bind(this.hide, this));
    },
    show: function(){
      this.$crosshairEl.hide();
      this.$panelEl.show();
    },
    hide: function(){
      this.$crosshairEl.show();
      this.$panelEl.hide();
    },
  });

  S.PlaceFormView = S.ContentView.extend({
    /*
     * View responsible for the form for adding and editing places.
     */

    initialize: function(){
      // Call super to initialize the panel-related element references
      S.PlaceFormView.__super__.initialize.call(this);

      this.model.on('focus', this.focus, this);
    },
    render: function(){

      return this;
    },
    focus: function() {
      // Show thyself!
      this.show();
    },
    hide: function() {
      S.PlaceFormView.__super__.hide.call(this);

      // Also, cancel adding the model if it's new
      if (this.model.isNew()) {
        this.model.destroy();
      }

      // Otherwise, just unfocus
      else {
        this.model.trigger('unfocus');
      }
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
      this.latLng = new L.LatLng(this.model.get('lat'), this.model.get('lng'));
      this.layer = new L.Marker(this.latLng);
      this.render();
    },
    updateLayer: function() {
      if (this.layer) {
        this.removeLayer();
      }
      this.initLayer();
    },
    removeLayer: function() {
      this.options.placeLayers.removeLayer(this.layer);
    },
    render: function() {
      var mapBounds = this.map.getBounds();
      if (mapBounds.contains(this.latLng)) {
        this.show();
      } else {
        this.hide();
      }
    },
    focus: function() {
      var map = this.map,
          mapSize = this.map.getSize(),
          pos = this.map.latLngToLayerPoint(this.latLng),
          ratioX = 1/4; // percentage of map width between map center and focal point, hard coded bad

      map.panTo(map.layerPointToLatLng( new L.Point(pos.x + ratioX * mapSize.x, pos.y) ));

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
      this.options.placeLayers.addLayer(this.layer);
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
      self.map.setView(new L.LatLng(self.options.lat, self.options.lng), self.options.zoom);

      // Bind data events
      self.collection.on('reset', self.render, self);
      self.collection.on('add', self.addLayerView, self);
      self.collection.on('remove', self.removeLayerView, self);

      self.collection.fetch();
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
