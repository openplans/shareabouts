/*globals _ jQuery L Backbone Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  // Spinner options
  S.bigSpinnerOptions = {
    lines: 13, length: 0, width: 10, radius: 30, corners: 1, rotate: 0,
    direction: 1, color: '#000', speed: 1, trail: 60, shadow: false,
    hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto',
    left: 'auto'
  };

  S.smallSpinnerOptions = {
    lines: 13, length: 0, width: 3, radius: 10, corners: 1, rotate: 0,
    direction: 1, color: '#000', speed: 1, trail: 60, shadow: false,
    hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto',
    left: 'auto'
  };

  S.AppView = Backbone.View.extend({
    events: {
      'click #add-place': 'onClickAddPlaceBtn',
      'click .close-bttn': 'onClickClosePanelBtn'
    },
    initialize: function(){
      // Boodstrapped data from the page
      this.activities = this.options.activities;
      this.places = this.collection;

      $('body').ajaxError(function(evt, request, settings){
        $('#ajax-error-msg').show();
      });

      $('body').ajaxSuccess(function(evt, request, settings){
        $('#ajax-error-msg').hide();
      });

      // Handle collection events
      this.collection.on('add', this.onAddPlace, this);
      this.collection.on('remove', this.onRemovePlace, this);

      // Only append the tools to add places (if supported)
      $('#map-container').append(Handlebars.templates['add-places'](this.options.placeConfig));

      this.pagesNavView = (new S.PagesNavView({
              el: '#pages-nav-container',
              pagesConfig: this.options.pagesConfig,
              router: this.options.router
            })).render();

      this.authNavView = (new S.AuthNavView({
              el: '#auth-nav-container',
              router: this.options.router
            })).render();

      // Activity is enabled by default (undefined) or by enabling it
      // explicitly. Set it to a falsey value to disable activity.
      if (_.isUndefined(this.options.activityConfig.enabled) ||
        this.options.activityConfig.enabled) {
        // Init the view for displaying user activity
        this.activityView = new S.ActivityView({
          el: 'ul.recent-points',
          collection: this.activities,
          places: this.places,
          router: this.options.router,
          placeTypes: this.options.placeTypes,
          surveyConfig: this.options.surveyConfig,
          supportConfig: this.options.supportConfig,
          placeConfig: this.options.placeConfig,
          // How often to check for new content
          interval: this.options.activityConfig.interval || 30000
        });
      }

      // Init the map view to display the places
      this.mapView = new S.MapView({
        el: '#map',
        mapConfig: this.options.mapConfig,
        collection: this.collection,
        router: this.options.router,
        placeTypes: this.options.placeTypes
      });

      // Cache panel elements that we use a lot
      this.$panel = $('#content');
      this.$panelContent = $('#content article');
      this.$panelCloseBtn = $('.close-bttn');
      this.$centerpoint = $('#centerpoint');
      this.$instructions = $('#instructions');
      this.$addButton = $('#add-place');

      // Bind to map move events so we can style our center points
      // with utmost awesomeness.
      this.mapView.map.on('movestart', this.onMapMoveStart, this);
      this.mapView.map.on('moveend', this.onMapMoveEnd, this);

      // This is the "center" when the popup is open
      this.offsetRatio = {x: 0.2, y: 0.0};

      // Caches of the views (one per place)
      this.placeFormView = null;
      this.placeDetailViews = {};

      // Show tools for adding data
      this.showAddButton();
      this.showCenterPoint();
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
          offsetPoint = L.point(centerPoint.x - mapSize.x * this.offsetRatio.x,
                                    centerPoint.y - mapSize.y * this.offsetRatio.y);
      return map.layerPointToLatLng(offsetPoint);
    },
    getOffsetCenter: function(latLng) {
      var map = this.mapView.map,
          mapSize = map.getSize(),
          pos = map.latLngToLayerPoint(latLng);

      return map.layerPointToLatLng(
        L.point(pos.x + this.offsetRatio.x * mapSize.x,
                pos.y + this.offsetRatio.y * mapSize.y) );
    },
    onMapMoveStart: function(evt) {
      this.$centerpoint.addClass('dragging');

      // fade the instructions out (and don't show them again)
      if (this.$instructions.is(':visible')) {
        this.instructionsShown = true;
      }

      this.hideInstructions();
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
      this.options.router.navigate('/', {trigger: true});
    },
    // This gets called for every model that gets added to the place
    // collection, not just new ones.
    onAddPlace: function(model) {
      // If it's new, then show the form in order to edit and save it.
      if (model.isNew()) {

        this.placeFormView = new S.PlaceFormView({
          model: model,
          appView: this,
          router: this.options.router,
          defaultPlaceTypeName: this.options.defaultPlaceTypeName,
          placeTypes: this.options.placeTypes,
          placeConfig: this.options.placeConfig
        });

        this.$panel.removeClass().addClass('place-form');
        this.showPanel(this.placeFormView.render().$el);
        // Autofocus on the first input element
        this.placeFormView.$('textarea, input').not('[type="hidden"]').first().focus();
        this.showNewPin();
        this.hideAddButton();
        this.hideInstructions(true);
      }
    },
    onRemovePlace: function(model) {
      if (this.placeDetailViews[model.cid]) {
        this.placeDetailViews[model.cid].remove();
        delete this.placeDetailViews[model.cid];
      }
    },
    getPlaceDetailView: function(model) {
      var placeDetailView;
      if (this.placeDetailViews[model.cid]) {
        placeDetailView = this.placeDetailViews[model.cid];
      } else {
        placeDetailView = new S.PlaceDetailView({
          model: model,
          surveyConfig: this.options.surveyConfig,
          supportConfig: this.options.supportConfig,
          placeConfig: this.options.placeConfig,
          placeTypes: this.options.placeTypes,
          userToken: this.options.userToken
        });
        this.placeDetailViews[model.cid] = placeDetailView;
      }

      return placeDetailView;
    },
    viewMap: function() {
      this.hidePanel();
      this.hideNewPin();
      this.destroyNewModels();
      this.showAddButton();
    },
    newPlace: function() {
      // Called by the router
      this.collection.add({});
    },
    viewPlace: function(model) {
      var map = this.mapView.map,
          layer, center, placeDetailView;

      if (model) {
        // Called by the router
        layer = this.mapView.layerViews[model.cid].layer;
        placeDetailView = this.getPlaceDetailView(model);
        center = layer.getLatLng ? layer.getLatLng() : layer.getBounds().getCenter();

        this.$panel.removeClass().addClass('place-detail place-detail-' + model.id);
        this.showPanel(placeDetailView.render().$el);
        this.hideNewPin();
        this.destroyNewModels();
        this.hideCenterPoint();
        this.hideAddButton();
        this.hideInstructions(true);

        map.panTo(this.getOffsetCenter(center));

        // Focus the one we're looking
        model.trigger('focus');
      } else {
        this.options.router.navigate('/');
      }
    },
    viewPage: function(slug) {
      var pageConfig = _.find(this.options.pagesConfig, function(pageConfig) {
            return pageConfig.slug ===  slug;
          }),
          pageTemplateName = 'pages/' + (pageConfig.name || pageConfig.slug),
          pageHtml = Handlebars.templates[pageTemplateName]({config: this.options.config});

      this.$panel.removeClass().addClass('page page-' + slug);
      this.showPanel(pageHtml);

      this.hideNewPin();
      this.destroyNewModels();
      this.hideCenterPoint();
      this.hideAddButton();
      this.hideInstructions(true);
    },
    showPanel: function(markup) {
      this.unfocusAllPlaces();

      this.$panelContent.html(markup);
      this.$panel.show();

      this.$panelContent.scrollTop(0);
      $(S).trigger('panelshow', [this.options.router, Backbone.history.getFragment()]);
    },
    showNewPin: function() {
      var map = this.mapView.map;

      this.$centerpoint.show().addClass('newpin');
      map.panTo(this.getOffsetCenter(map.getCenter()));
    },
    showAddButton: function() {
      this.$addButton.show();
    },
    hideAddButton: function() {
      this.$addButton.hide();
    },
    showCenterPoint: function() {
      this.$centerpoint.show().removeClass('newpin');
    },
    hideCenterPoint: function() {
      this.$centerpoint.hide();
    },
    showInstructions: function() {
      var self = this;

      if (self.instructionsShown) {
        return;
      }

      self.$instructions.css('display', null).addClass('show');
      // also add a class to the add button, indicating that we are instructing
      self.$addButton.addClass('instructionsShowing');
    },
    hideInstructions: function(instant) {
      if (instant) {
        this.$instructions.removeClass('show');
      } else {
        this.$instructions.fadeOut();
      }

      this.$addButton.removeClass('instructionsShowing');
    },
    hidePanel: function() {
      this.unfocusAllPlaces();
      this.$panel.hide();

      this.showInstructions();
    },
    hideNewPin: function() {
      this.showCenterPoint();
    },
    unfocusAllPlaces: function() {
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
}(Shareabouts, jQuery, Shareabouts.Util.console));
