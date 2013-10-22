/*globals _ jQuery L Backbone Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.AppView = Backbone.View.extend({
    events: {
      'click #add-place': 'onClickAddPlaceBtn',
      'click .close-btn': 'onClickClosePanelBtn'
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
      this.$panelCloseBtn = $('.close-btn');
      this.$centerpoint = $('#centerpoint');
      this.$addButton = $('#add-place-btn-container');

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
    // Get the center of the map
    getCenter: function() {
      return this.mapView.map.getCenter();
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

        map.panTo(center, {animate: true});

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
    },
    showPanel: function(markup) {
      var map = this.mapView.map;

      this.unfocusAllPlaces();

      this.$panelContent.html(markup);
      this.$panel.show();

      this.$panelContent.scrollTop(0);
      $('body').addClass('content-visible');
      map.invalidateSize({ pan:false });
      $(S).trigger('panelshow', [this.options.router, Backbone.history.getFragment()]);
    },
    showNewPin: function() {
      var map = this.mapView.map;
      this.$centerpoint.show().addClass('newpin');
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
    hidePanel: function() {
      var map = this.mapView.map;

      this.unfocusAllPlaces();
      this.$panel.hide();
      $('body').removeClass('content-visible');
      map.invalidateSize({ pan:false });
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
