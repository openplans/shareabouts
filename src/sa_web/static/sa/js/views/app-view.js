var Shareabouts = Shareabouts || {};

(function(S, $){
  S.AppView = Backbone.View.extend({
    events: {
      'click #add-place': 'onClickAddPlaceBtn',
      'click .close-bttn': 'onClickClosePanelBtn'
    },
    initialize: function(){
      // Boodstrapped data from the page
      this.activities = this.options.activities;
      this.places = this.collection;

      // Handle collection events
      this.collection.on('add', this.onAddPlace, this);
      this.collection.on('remove', this.onRemovePlace, this);
      this.collection.on('reset', this.onResetPlaces, this);

      // Init the map view to display the places
      // TODO: remove hard coded values here, add to config
      this.mapView = new S.MapView({
        el: '#map',
        center: {lat: 39.9523524, lng: -75.1636075},
        zoom: 14,
        collection: this.collection,
        router: this.options.router,
        placeTypes: this.options.placeTypes
      });

      // Init the view for displaying user activity
      this.activityView = new S.ActivityView({
        el: 'ul.recent-points',
        collection: this.activities,
        places: this.places,
        router: this.options.router
      });

      // Cache panel elements that we use a lot
      this.$panel = $('#content');
      this.$panelContent = $('#content article');
      this.$panelCloseBtn = $('.close-bttn');
      this.$centerpoint = $('#centerpoint');

      // Bind to map move events so we can style our center points
      // with utmost awesomeness.
      this.mapView.map.on('movestart', this.onMapMoveStart, this);
      this.mapView.map.on('moveend', this.onMapMoveEnd, this);

      // This is the "center" when the popup is open
      this.offsetRatio = {x: 0.2, y: 0.0};

      // Caches of the views (one per place)
      this.placeFormViews = {};
      this.placeDetailViews = {};
    },
    // Get the appropriate center, depending on the visibility of the
    // content panel
    getCenter: function() {
      if (this.$panel.is(':visible')) {
          return this.getFocusedCenter();
      } else {
        return this.mapView.map.getCenter();
      }
    },
    // Okay, so this is really confusing but here goes. We have three things
    // we're talking about:
    //   - map center: the real center of the map
    //   - offset center: the lat/lng of what will be the map center after you
    //     open the content panel
    //   - focused center: the lat/lng of the former map center after we open
    //     the content panel and reposition the map
    getFocusedCenter: function() {
      var map = this.mapView.map,
          centerLatLng = map.getCenter(),
          centerPoint = map.latLngToLayerPoint(centerLatLng),
          mapSize = map.getSize(),
          offsetPoint = new L.Point(centerPoint.x - mapSize.x * this.offsetRatio.x,
                                    centerPoint.y - mapSize.y * this.offsetRatio.y);
      return map.layerPointToLatLng(offsetPoint);
    },
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
    // This gets called for every model that gets added to the place
    // collection, not just new ones.
    onAddPlace: function(model) {
      var placeFormView = new S.PlaceFormView({
            model: model,
            appView: this,
            router: this.options.router,
            placeTypes: this.options.placeTypes
          }),
          placeDetailView = new S.PlaceDetailView({
            model: model,
            surveyConfig: this.options.surveyConfig
          });

      this.placeFormViews[model.cid] = placeFormView;
      this.placeDetailViews[model.cid] = placeDetailView;

      // If it's new, then show the form in order to edit and save it.
      if (model.isNew()) {
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
      // Called by the router
      var placeModel = new S.PlaceModel();
      this.collection.add(placeModel);
    },
    viewPlace: function(model) {
      // Called by the router
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
