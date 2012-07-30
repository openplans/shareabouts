var Shareabouts = Shareabouts || {};

(function(S, $){
  S.AppView = Backbone.View.extend({
    events: {
      'click #add-place': 'onClickAddPlaceBtn',
      'click .close-bttn': 'onClickClosePanelBtn'
    },
    initialize: function(){
      this.activities = this.options.activities;
      this.places = this.collection;

      this.collection.on('add', this.onAddPlace, this);
      this.collection.on('remove', this.onRemovePlace, this);
      this.collection.on('reset', this.onResetPlaces, this);

      this.mapView = new S.MapView({
        el: '#map',
        center: {lat: 39.9523524, lng: -75.1636075},
        zoom: 14,
        collection: this.collection,
        router: this.options.router,
        placeTypes: this.options.placeTypes
      });

      this.activityListView = new S.ActivityListView({
        el: 'ul.recent-points',
        collection: this.activities,
        places: this.places,
        router: this.options.router
      });

      // Panel!!!
      this.$panel = $('#content');
      this.$panelContent = $('#content article');
      this.$panelCloseBtn = $('.close-bttn');
      this.$centerpoint = $('#centerpoint');

      this.mapView.map.on('movestart', this.onMapMoveStart, this);
      this.mapView.map.on('moveend', this.onMapMoveEnd, this);

      this.offsetRatio = {x: 0.2, y: 0.0};

      this.placeFormViews = {};
      this.placeDetailViews = {};
    },
    getCenter: function() {
      if (this.$panel.is(':visible')) {
          return this.getFocusedCenter();
      } else {
        return this.mapView.map.getCenter();
      }
    },
    getFocusedCenter: function() {
      var map = this.mapView.map,
          centerLatLng = map.getCenter(),
          centerPoint = map.latLngToLayerPoint(centerLatLng),
          mapSize = map.getSize(),
          offsetPoint = new L.Point(centerPoint.x - mapSize.x * this.offsetRatio.x,
                                    centerPoint.y - mapSize.y * this.offsetRatio.y);
      return map.layerPointToLatLng(offsetPoint);
    },
    // The lat/lng of what should be the new center of the map when you need to
    // "focus" a marker between the content panel and the left side of the screen.
    getOffsetCenter: function(latLng) {
      var map = this.mapView.map,
          mapSize = map.getSize(),
          pos = map.latLngToLayerPoint(latLng);

      return map.layerPointToLatLng(
        new L.Point(pos.x + this.offsetRatio.x * mapSize.x,
                    pos.y + this.offsetRatio.y * mapSize.y) );
    },
    onMapMoveStart: function(evt) {
      this.$centerpoint.addClass('dragging');
    },
    onMapMoveEnd: function(evt) {
      this.$centerpoint.removeClass('dragging');
    },
    onClickAddPlaceBtn: function(evt) {
      evt.preventDefault();
      this.options.router.navigate('/place/new', {trigger: true});
    },
    onClickClosePanelBtn: function(evt) {
      evt.preventDefault();
      this.hidePanel();
      this.hideNewPin();
      this.destroyNewModels();
      this.options.router.navigate('/');
    },
    onAddPlace: function(model) {
      var placeFormView = new S.PlaceFormView({
            model: model,
            appView: this,
            router: this.options.router,
            placeTypes: this.options.placeTypes
          }),
          placeDetailView = new S.PlaceDetailView({
            model: model
          });

      this.placeFormViews[model.cid] = placeFormView;
      this.placeDetailViews[model.cid] = placeDetailView;

      if (model.isNew()) {
        // TODO: keep an eye on this; not sure whether we should be showing the
        //       panel every time a model is added to the collection.
        this.showPanel(placeFormView);
        this.showNewPin();
      }
    },
    onRemovePlace: function(model) {
      this.placeFormViews[model.cid].remove();
      this.placeDetailViews[model.cid].remove();

      delete this.placeFormViews[model.cid];
      delete this.placeDetailViews[model.cid];
    },
    onResetPlaces: function(collection) {
      var self = this;
      collection.each(function(model) {
        self.onAddPlace(model);
      });
    },
    newPlace: function() {
      var placeModel = new Backbone.Model();
      this.collection.add(placeModel);
    },
    viewPlace: function(model) {
      var map = this.mapView.map,
          location = model.get('location'),
          placeDetailView = this.placeDetailViews[model.cid];

      this.showPanel(placeDetailView);
      this.hideNewPin();
      this.destroyNewModels();
      this.hideCenterPoint();
      map.panTo(this.getOffsetCenter(new L.LatLng(location.lat, location.lng)));

      // Focus the one we're looking
      model.trigger('focus');
    },
    showPanel: function(view) {
      this.unfocusAllMarkers();
      this.$panelContent.html(view.render().$el);
      this.$panel.show();
    },
    showNewPin: function() {
      var map = this.mapView.map;

      this.$centerpoint.show().addClass('newpin');
      map.panTo(this.getOffsetCenter(map.getCenter()));
    },
    hideCenterPoint: function() {
      this.$centerpoint.hide();
    },
    hidePanel: function() {
      this.unfocusAllMarkers();
      this.$panel.hide();
    },
    hideNewPin: function() {
      this.$centerpoint.show().removeClass('newpin');
    },
    unfocusAllMarkers: function() {
      // Unfocus all of the markers
      this.collection.each(function(m){
        if (!m.isNew()) {
          m.trigger('unfocus');
        }
      });
    },
    destroyNewModels: function() {
      this.collection.each(function(m){
        if (m.isNew()) {
          m.destroy();
        }
      });
    },
    render: function() {
      this.mapView.render();
    }
  });
})(Shareabouts, jQuery);