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
      var data = _.extend({
        pretty_created_datetime: function() {
          return S.Util.getPrettyDateTime(this.created_datetime);
        }
      }, this.model.toJSON());

      this.$el.html(ich['place-detail'](data));
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

      this.placeTypes = _.keys(this.options.placeTypes);
    },
    render: function(){
      var data = _.extend({
        placeTypes: this.placeTypes
      }, this.model.toJSON());

      this.$el.html(ich['place-form'](data));
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

      this.placeType = this.options.placeTypes[this.model.get('location_type')];

      if (!this.placeType) {
        console.warn('Place type', this.model.get('location_type'),
          'is not configured so it will not appear on the map.');
        return;
      }

      if (!this.model.isNew()) {
        location = this.model.get('location');
        this.latLng = new L.LatLng(location.lat, location.lng);

        this.layer = new L.Marker(this.latLng, {icon: this.placeType['default']});

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
    },
    onMarkerClick: function() {
      this.options.router.navigate('/place/' + this.model.id, {trigger: true});
    },
    focus: function() {
      if (this.placeType) {
        this.setIcon(this.placeType.focused);
      }
    },
    unfocus: function() {
      if (this.placeType) {
        this.setIcon(this.placeType['default']);
      }
    },
    remove: function() {
      this.removeLayer();
      this.map.off('move', this.throttledRender, this);
    },
    setIcon: function(icon) {
      if (this.layer) {
        this.layer.setIcon(icon);
      }
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
        placeTypes: this.options.placeTypes
      });
    },
    removeLayerView: function(model) {
      this.layerViews[model.cid].remove();
      delete this.layerViews[model.cid];
    }
  });


  S.ActivityListView = Backbone.View.extend({
    initialize: function() {
      var self = this;

      this.activityViews = [];
      this.$container = this.$el.parent();
      this.interval = this.options.interval || 5000;
      this.infiniteScrollBuffer = this.options.infiniteScrollBuffer || 25;
      this.debouncedOnScroll = _.debounce(this.onScroll, 600);

      this.$el.delegate('a', 'click', function(evt){
        evt.preventDefault();
        self.options.router.navigate(this.getAttribute('href'), {trigger: true});
      });

      this.$container.on('scroll', _.bind(this.debouncedOnScroll, this));

      this.collection.on('add', this.onAddActivity, this);
      this.collection.on('reset', this.onResetActivities, this);

      this.checkForNewActivity();
    },

    checkForNewActivity: function() {
      // Only get new activity where id is greater than the newest id
      if (this.collection.size() > 0) {
        this.collection.fetch({
          data: {after: this.collection.first().get('id')},
          add: true,
          at: 0
        });
      }

      _.delay(_.bind(this.checkForNewActivity, this), this.interval);
    },

    onScroll: function(evt) {
      var self = this,
          notFetchingDelay = 500,
          notFetching = function() { self.fetching = false; },
          shouldFetch = (this.$el.height() - this.$container.height() <=
                        this.$container.scrollTop() + this.infiniteScrollBuffer);

      if (shouldFetch && !self.fetching) {
        self.fetching = true;
        this.collection.fetch({
          data: {before: this.collection.last().get('id'), limit: 10},
          add: true,
          success: function() { _.delay(notFetching, notFetchingDelay); },
          error: function() {_.delay(notFetching, notFetchingDelay); }
        });
      }
    },

    onAddActivity: function(model, collection, options) {
      this.renderActivity(model, options.index);

      // TODO Only do the following if the activity instance is a place.
      this.options.places.add(model.get('data'));
    },

    onResetActivities: function(collection) {
      this.render();
    },

    renderActivity: function(model, index) {
      var $template = ich['activity-list-item'](model.toJSON());
      if (index >= this.$el.children().length) {
        this.$el.append($template);
      } else {
        $template
          // Hide first so that slideDown does something
          .hide()
          // Insert before the index-th element
          .insertBefore(this.$el.find('.activity-item:nth-child('+index+1+')'))
          // Nice transition into view ()
          .slideDown();

        // Just adds it with no transition
        // this.$el.find('.activity-item:nth-child('+index+1+')').before($template);
      }
    },

    render: function(){
      var self = this;

      self.$el.empty();
      self.collection.each(function(model) {
        self.renderActivity(model, self.collection.length);
      });
      return self;
    }
  });
})(Shareabouts, jQuery);
