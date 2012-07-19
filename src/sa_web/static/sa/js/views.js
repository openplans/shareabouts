var Shareabouts = Shareabouts || {};

(function(S, $){
  // Copy and paste me to start a new view
  // S.View = Backbone.View.extend({
  //   initialize: function(){},
  //   render: function(){}
  // });

  S.ContentView = Backbone.View.extend({
    initialize: function() {
      this.$panelEl = $(this.options.panelEl);
      this.$crosshairEl = $(this.options.crosshairEl);
      this.$closeBtn = $(this.options.closeBtnEl);

      this.$closeBtn.click(_.bind(this.hide, this));
    },
    show: function(content){
      if (content) {
        this.setContent(content);
      }
      this.$crosshairEl.hide();
      this.$panelEl.show();
    },
    hide: function(){
      this.$crosshairEl.show();
      this.$panelEl.hide();
    },
    setContent: function(content) {
      this.$el.html(content);
    }
  });

  S.PlaceFormView = S.ContentView.extend({
    initialize: function(){
      // Super!
      S.PlaceFormView.__super__.initialize.call(this);

      this.model.on('focus', this.focus, this);
    },
    render: function(){

      return this;
    },
    focus: function() {
      // Show thyself!
      this.show();
    }

  });

  S.LayerView = Backbone.View.extend({
    initialize: function(){
      this.model.on('change', this.updateLayer, this);
      this.model.on('focus', this.focus, this);

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
    focus: function() {
      var map = this.options.map,
          mapSize = this.options.map.getSize(),
          pos = this.options.map.latLngToLayerPoint(this.latLng),
          ratioX = 1/4; // percentage of map width between map center and focal point, hard coded bad

      map.panTo(map.layerPointToLatLng( new L.Point(pos.x + ratioX * mapSize.x, pos.y) ));

      // TODO turn the icon red if not new
    },
    unfocus: function() {
      // TODO turn the icon blue
    },
    setIcon: function() {

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

      // TODO move this to the LayerView?
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
    onDragEnd: function() {
      // TODO move this to the LayerView?
      _.each(this.layerViews, function(view, cid) {
        view.render();
      });
    }
  });
})(Shareabouts, jQuery);