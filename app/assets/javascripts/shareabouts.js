/*
 * requires leaflet, jquery 1.1.4, mustache
 */
$.widget("ui.shareabout", (function() {
  var map, // leaflet map
      fsm, // state machine
      layersOnMap, // object that stores map features (marker layers, specifically) by their ID
      popup, // one popup on the map
      featurePointsCache = [],  // Cache of all of the feature points
      popularityStats, // popularity stats about the current features in the cache
      popularityThreshold = 0; // The min popularity to show

  return {
    options : {
      // Leaflet map options
      map                  : {}, // req: center
      // Map-related
      tileUrl              : null,
      tileAttribution      : '',
      initialZoom          : 13,
      markerIcon           : new L.Icon(), //default icon, can be customized
      focusedMarkerIcon    : new L.Icon(), //default icon, can be customized
      newMarkerIcon        : new L.Icon(), //default icon, can be customized
      crosshairIcon        : null, // L.Icon for crosshair used when locating on touch screen devices
      //
      withinBounds         : true,
      featuresUrl          : null, // url to all features geoJSON
      // featureUrl: url to feature json - should return a 'view' that contains popup content, resource ID should be indicated as FEATURE_ID to be subbed
      featureUrl           : null,
      initialFeatureId     : null, // this was permalinked, so show it on load
      featurePopupTemplate : null,
      dragHint             : "",
      dragHintLong         : "",
      callbacks : {
        onready : function() {}, // after transitioning to "ready" state (closed popups, clean slate)
        onload  : function() {}, // after the map is initially loaded
        onpopup : function() {}  // after a popup is opened
      }
    },

    /**
     * Constructor
     */
    _create : function() {
      var self = this;

      layersOnMap = {};
      map      = new L.Map( this.element.attr("id"), this.options.map );
      popup    = new InformationPanel({
        onRemove : function() { self._resetState(); },
        onOpen   : self.options.callbacks.onpopup
      });

      this.hint       = new Hint(this.element, map);
      this.newFeature = new L.Marker(this.options.map.center, {
        icon: self.options.newMarkerIcon,
        draggable: true
      });
      this.newFeature.on("drag", function(drag) {
        self.hint.remove();
      } );

      // Set up Leaflet map
      map.setView(this.options.map.center, this.options.initialZoom);
      map.addLayer(new L.TileLayer( this.options.tileUrl, {
        maxZoom: this.options.map.maxZoom, attribution: this.options.tileAttribution
      }));
      map.attributionControl.setPrefix('');

      // TODO: What is this doing?
      map.on('layerremove', function(e) {
        if (e.layer == self.newFeature) self.newFeature._visible = false;
      });
      map.on('layeradd', function(e){ if (e.layer == self.newFeature) self.newFeature._visible = true; });
      map.on('click', function(e){ self._removePopup(); });
      map.on('drag', function(drag) {
        self.hint.remove();
      } );

      // Update featurePointsCache and populate the map
      this._fetch(function(){
        self.refreshMapFeatures(self.options.callbacks.onload);
        self.options.callbacks.onload = function(){}; // prevent multiple onload callbacks

        map.on('moveend', function(e){ self.refreshMapFeatures(); });
        $(window).resize( function(e){ self._refreshMapFeaturesWithDelay(); });

        // Check every 10 seconds for new points from another session
        setInterval(function(){
          // Update the cache
          self._fetch(function(data){
            if (data.length) {
              self.refreshMapFeatures();
            }
          });
        }, 10000);
      });

      this._init_states();
      this.options.callbacks.onready(); // manually trigger transition to ready state
    },

    /*****************
      PUBLIC
    *****************/

    /**
     * Drops a pin on the map - at latLng, if provided, or map center.
     * Advances map state to locatingFeature.
     * Can be called from ready state.
     * @param {L.LatLng} latLng the optional location to place the locating marker.
     */
    locateNewFeature : function(latLng) {
      fsm.locateNewFeature(latLng);
    },

    /**
     * Gets the form via the ajax options passes in.
     * Unless otherwise specified via success callback, loads form into popup for this.newFeature marker.
     * @param {Object} ajaxOptions options for jQuery.ajax(). By default, success loads responseData.view into popup.
     */
    loadNewFeatureForm : function(ajaxOptions) {
      fsm.loadNewFeatureForm(ajaxOptions);
    },

    finalizeNewFeature : function() {
      fsm.finalizeNewFeature();
    },

    submitNewFeature : function(ajaxOptions) {
      fsm.submitNewFeature(ajaxOptions);
    },

    /**
     * Displays a hint with content message at location latlng
     * @param {String} message Content for the hint.
     * @param {L.LatLng} latlng Location of hint.
     */
    showHint : function(message, layer) {
      this.hint.open(message, this.smallScreen(), layer);
    },

    /**
     * Returns the leaflet map
     */
    getMap : function () { return map; },

    /**
     * Returns the info popup
     */
    getPopup : function () { return popup; },

    /**
     * Returns the new Feature marker
     */
    getNewFeatureMarker : function () { return this.newFeature || null; },

    /**
     * Opens the popup for a feature
     */
    viewFeature : function(fId) {
      if (fsm.is("viewingFeature")) {
        // Don't reset everything if I'm already showing a feature
        // No state change is triggered.
        this._unsetFocusedIcon();
        this._viewFeature(fId);
      } else {
        // Reset the state
        if (fsm.can("ready")) {
          fsm.ready();
        } else if (fsm.can("cancel")) {
          fsm.cancel();
        }

        fsm.viewFeature(fId);
      }
    },

    /**
     * Add a click listener within the map popup.
     * @param {String} selector CSS selector (within popup) to element(s) on which to add listener.
     * @param {function} callback function to be called on click of selected element
     */
    addClickEventListenerToPopup : function(selector, callback) {
      popup.addClickEventListener(selector, callback);
    },

    addMapFeature: function(feature){
      markerLayer = new L.Marker(
        new L.LatLng(feature.lat, feature.lon),
        { icon: this.iconFor(feature.location_type) }
      );
      this._setupMarker(markerLayer, { id: feature.id });

      layersOnMap[feature.id] = markerLayer;
      map.addLayer(markerLayer);
    },
    
    // If a marker icon exists for this location's type, use that as the marker
    iconFor : function(location_type) {
      if (this.options.locationTypeMarkerIcons[location_type])
        return new this.options.locationTypeMarkerIcons[location_type]();
      else
        return this.options.markerIcon;
    },

    // Refresh map features from the cache for the current extent.
    refreshMapFeatures : function(callback){
      var i,
          bounds = map.getBounds(),
          len = featurePointsCache.length,
          feature,
          inBounds,
          onMap,
          isPopular,
          markerLayer;

      for(i=0; i<len; i++) {
        feature = featurePointsCache[i];

        // Popular enough to show
        isPopular = feature.pop >= popularityThreshold;
        // In the current map bounds
        inBounds = this._isFeatureInBounds(feature, bounds);
        // Not not something truthy is true
        onMap = !!layersOnMap[feature.id];

        // If inBounds and not onMap, add it
        if (inBounds && !onMap && isPopular) {
          this.addMapFeature(feature);
        }

        // If not popular or not inBounds and onMap, remove it
        if ((!isPopular || !inBounds) && onMap) {
          map.removeLayer(layersOnMap[feature.id]);
          delete layersOnMap[feature.id];
        }
      }

      if (callback) {callback();}
    },

    // Will update the map and only show features that are more popular
    // than the given value.
    filterByPopularity: function(pop) {
      popularityThreshold = pop;
      this.refreshMapFeatures();
    },

    getPopularityStats: function() {
      return popularityStats;
    },

    openPopup : function(content) {
      // Unsfocus the icon if highlighted
      this._unsetFocusedIcon();

      // Init the popup
      popup.setContent(content);
      popup.positionFor(this.smallScreen());
      popup.open();
    },

    smallScreen : function() {
      return this.element[0].offsetWidth <= 480;
    },

    /*
     * Private
     */

    _viewFeature: function(fId) {
      var self = this,
          onMap = !!layersOnMap[fId],
          cacheIndex = self._getCachedFeatureIndex(fId),
          inCache = cacheIndex !== null;


      // Internal helper function
      var openPopup = function(featureOnMap) {
        var resource_path;

        // Does the marker have content already? Does this mean the current
        // marker?
        if (featureOnMap._html) {
          self._openPopupWith( featureOnMap );
        } else {
          // No? Okay, go get it
          resource_path = self.options.featureUrl.replace(/FEATURE_ID/, fId);
          $.get( resource_path, function(data){
            self._openPopupWith( featureOnMap, data.view);

            // Update the url
            if (window.history && window.history.pushState) {
              window.history.pushState(null, null, resource_path);
            }
          }, "json");
        }
      };

      // If the marker is on the map, then open the popup!
      if (onMap) {
        openPopup(layersOnMap[fId]);
      } else {
        // It's in the cache, but not on the map. Add it manually so
        // the popup can open. That will trigger a map move and then
        // the rest of the markers will sync up.
        if (inCache) {
          self.addMapFeature(featurePointsCache[cacheIndex]);
          openPopup(layersOnMap[fId]);
        } else {
          // Oops, we don't know about the guy at all. Let's sync up the
          // cache, manually add the feature, then open the popup.
          self._fetch(function() {
            // Fetch updates the cache, so let's get the index again
            cacheIndex = self._getCachedFeatureIndex(fId);

            self.addMapFeature(featurePointsCache[cacheIndex]);
            openPopup(layersOnMap[fId]);
          });
        }
      }
    },

    // Fetches feature locations from the server and populates
    // the cache. This function will always check the cache
    // and only request new feature locations.
    _fetch: function(success, error) {
      var self = this,
          data = {};

      if (!this.options.featuresUrl) {return;}

      // Only fetch records with an id greater than our newest cached record.
      if (featurePointsCache.length > 0) {
        data.after = featurePointsCache[featurePointsCache.length - 1].id;
      }

      // Get the feature points from the server
      $.ajax({
        url: this.options.featuresUrl,
        data: data,
        dataType: 'json',
        success: function(data){
          if($.isArray(data) && data.length) {
            featurePointsCache = featurePointsCache.concat(data);
            popularityStats = self._getPopularityStats();
          }
          if (success) {success(data);}
        },
        error: function() {
          if (error) {error();}
        }
      });
    },

    _isFeatureInBounds: function(feature, bounds) {
      var topLeft = bounds.getNorthWest(),
          bottomRight = bounds.getSouthEast();

        return (feature.lat <= topLeft.lat && feature.lat >= bottomRight.lat &&
            feature.lon <= bottomRight.lng && feature.lon >= topLeft.lng);
    },

    _getCachedFeatureIndex: function(fId) {
      var i,
          len = featurePointsCache.length;

      for (i=0; i<len; i++) {
        if (featurePointsCache[i].id === fId) {
          return i;
        }
      }

      return null;
    },

    _getPopularityStats: function() {
      var i,
          len = featurePointsCache.length,
          statsObj = {},
          uniquePopVals = [],
          key;

      for (i=0; i<len; i++) {
        statsObj[featurePointsCache[i].pop] = true;
      }

      if (Object.keys) {
        uniquePopVals = Object.keys(statsObj);
      } else {
        for (key in statsObj) {
          if (statsObj.hasOwnProperty(key)) {
            uniquePopVals.push(key);
          }
        }
      }

      return {
        uniqueVals: uniquePopVals.sort(function compareNumbers(a, b){ return a - b; })
      };
    },

    _refreshMapFeaturesWithDelay : function(ms) {
      if (this._waitingToLoad) return;

      var self = this;
      if (!ms) ms = 500;
      this._waitingToLoad = window.setTimeout( function(){
        self._waitingToLoad = null;
        self.refreshMapFeatures();
      }, ms);
    },

    // Centers the map at a point that will center the actual point of interest in the visible view
    _scrollViewTo : function(latLng) {
      var mapWidth  = this.element[0].offsetWidth,
          mapHeight = this.element[0].offsetHeight,
          pos       = map.latLngToLayerPoint(latLng);

      if (this.smallScreen()) {
        var ratioY = -0.42; // percentage of map height between map center and focal point, hard coded bad
        map.panTo(map.layerPointToLatLng( new L.Point(pos.x, pos.y + ratioY * mapHeight ) ));
      } else {
        var ratioX = 1/4; // percentage of map width between map center and focal point, hard coded bad
        map.panTo(map.layerPointToLatLng( new L.Point(pos.x + ratioX * mapWidth, pos.y) ));
      }
    },

    // Opens the popup for the layer, populated with content.
    _openPopupWith : function(layer, content) {
      popup.setContent(content || layer._html);

      this._scrollViewTo( layer.getLatLng() );
      if (layer._icon) {
        this._setFocusedIcon(layer);
      }

      var self = this;
      window.setTimeout(function(){ // the map takes time to pan
        popup.positionFor(self.smallScreen(), $(layer._icon));
        popup.open();
      }, 400);
    },

    _setFocusedIcon : function(layer) {
      this.focusedMarkerLayer = layer;
      layer.setIcon(this.options.focusedMarkerIcon);
    },

    _unsetFocusedIcon : function() {
      if (this.focusedMarkerLayer) {
        var cacheIndex = this._getCachedFeatureIndex(this.focusedMarkerLayer._id);
        this.focusedMarkerLayer.setIcon( 
          this.iconFor(featurePointsCache[cacheIndex].location_type) );
      }
    },

    _resetState : function() {
      if (fsm.is("ready")) this.options.callbacks.onready();
      else if (fsm.can("ready")) fsm.ready();
      else if (fsm.can("cancel")) fsm.cancel();
    },

    _removePopup : function() {
      if (popup._opened()) popup.remove();
    },

    _setupMarker : function(marker, properties) {
      var shareabout = this,
          fId = properties.id;

      if (this.options.featurePopupTemplate)
        marker._html = $.mustache( this.options.featurePopupTemplate, properties );

      marker._id = fId;
      marker.on("click", function(click){
        shareabout.viewFeature(this._id);
      });
    },

    _touch_screen : function() {
      return('ontouchstart' in window);
    },

    _init_states : function() {
      var shareabout = this;

      // State machine handles the flow of creating and viewing map features
      fsm = StateMachine.create({
        initial : 'ready',
        events  : [
          // UI triggered. drops a marker onto the map. if passed L.LatLng, drops marker there.
          { name: 'locateNewFeature', from: ['ready', 'viewingFeature'], to: 'locatingNewFeature'},
          // UI triggered. can move from ready to loadingNewFeatureForm without first locating if location not required, chosen later, etc
          // if feature is already located, pass geoJSON representation of feature to loadNewFeatureForm
          { name: 'loadNewFeatureForm', from: ['ready', 'locatingNewFeature'], to: 'loadingNewFeatureForm'},
          // called internally after form has been loaded
          { name: 'finalizeNewFeature', from: 'loadingNewFeatureForm', to: 'finalizingNewFeature'},
          // UI triggered. pass geoJSON representation to transition and callback on success
          { name: 'submitNewFeature', from: ['finalizingNewFeature', 'locatingNewFeature'], to: 'submittingNewFeature'},
          // called internally after response from submit, if data status is error
          { name: 'errorNewFeature', from: 'submittingNewFeature', to: 'finalizingNewFeature'},
          // UI triggered. Pass ID of feature to view.
          { name: 'viewFeature', from: ['ready', 'locatingNewFeature', 'finalizingNewFeature', 'submittingNewFeature', 'viewingFeature'], to: 'viewingFeature'},
          // Ways to get back to ready
          { name: 'ready', from : ['ready', 'submittingNewFeature', 'viewingFeature'], to: 'ready'},
          { name: 'cancel', from: ['locatingNewFeature', 'finalizingNewFeature'], to: 'ready'}
        ]
      });

      fsm.onchangestate = function(eventName, from, to) {
        // if (window.console) window.console.info("Transitioning from " + from + " to " + to + " via " + eventName);

        // Allow callbacks for state change events
        if (shareabout.options.callbacks[eventName]) {
          shareabout.options.callbacks[eventName]();
        }
      };

      /*
       * If touch screen, displays crosshair, else
       * Drops a marker on the map at the center
       */
      fsm.onlocateNewFeature = function (eventName, from, to) {
        // Make sure the map is sized for its container correctly
        map.invalidateSize();

        if (shareabout._touch_screen()) {
          var wrapper = $("<div>").attr("id", "crosshair"),
              img     = $("<img>").attr("src", shareabout.options.crosshairIcon.iconUrl);

          shareabout.element.append(wrapper.html(img));
          $("#crosshair").css("left", shareabout.element[0].offsetWidth/2 - shareabout.options.crosshairIcon.iconAnchor.x + "px");
          $("#crosshair").css("top", shareabout.element[0].offsetHeight/2 - shareabout.options.crosshairIcon.iconAnchor.y + "px");
          shareabout.showHint(shareabout.options.dragHintLong);
        } else {
          shareabout.newFeature.setLatLng(map.getCenter());
          if (shareabout.newFeature.dragging) { shareabout.newFeature.dragging.enable(); }

          // Reset the icon when adding since we set it to the "focused" icon when confirming
          shareabout.newFeature.setIcon(shareabout.options.newMarkerIcon);

          map.addLayer(shareabout.newFeature);
          shareabout.showHint(shareabout.options.dragHint, shareabout.newFeature);
        }
      };

      /*
       * Performs an ajax request.
       * By default, if the json response contains a view property, that will be displayed in the marker popup.
       */
      fsm.onloadNewFeatureForm = function (eventName, from, to, ajaxOptions) {
        if (!shareabout.newFeature._visible) { // Touch screen, we located with crosshair
          shareabout.newFeature.setLatLng(map.getCenter());
          map.addLayer(shareabout.newFeature);
          $("#crosshair").remove();
        }

        shareabout.hint.remove();

        var ajaxCfg = {
          type : 'GET',
          success: function(data){
            shareabout._openPopupWith(shareabout.newFeature, data.view);
            shareabout.finalizeNewFeature();
          },
          dataType : 'json'
        };

        if ( typeof ajaxOptions == "object" ) $.extend(true, ajaxCfg, ajaxOptions);
        $.ajax(ajaxCfg);
      };

      /*
       * Submits new feature form.
       */
       fsm.onsubmitNewFeature = function (eventName, from, to, ajaxOptions) {
         var ajaxCfg = {
           type : 'POST',
           success : function(data) {
             if (data.status && data.status == "error")
               fsm.errorNewFeature(null, data);
             else
               fsm.viewFeature(data.feature_point.id, data);
           }
         };
         if ( typeof ajaxOptions == "object" ) $.extend(true, ajaxCfg, ajaxOptions);
         $.ajax(ajaxCfg);
      };

      /*
       * Creates a marker for the new feature using the properties in responseData.geoJSON.
       */
      fsm.onleavesubmittingNewFeature = function (eventName, from, to, id, responseData) {
        if (to === "viewingFeature") {
          // Set up focused marker
          var marker = new L.Marker(shareabout.newFeature.getLatLng(), { icon: shareabout.options.focusedMarkerIcon });
          shareabout._setupMarker(marker, responseData.feature_point);
          
          // Remove new feature marker
          map.removeLayer(shareabout.newFeature);

          // Indicate that the new marker is on the map
          layersOnMap[id] = marker;
          map.addLayer(marker);
          
          // Add to cache
          featurePointsCache = featurePointsCache.concat(responseData.feature_point);
          popularityStats    = shareabout._getPopularityStats();
        } else if (to === "finalizingNewFeature") {
          $(".shareabouts-side-popup-content").html(responseData.view);
        }
      };

      /*
       *
       */
      fsm.onviewFeature = function(eventName, from, to, fId) {
        shareabout._viewFeature(fId);
      };

      fsm.onleaveviewingFeature = function(eventName, from, to) {
        shareabout._removePopup();
        shareabout._unsetFocusedIcon();
      };

      fsm.onleavelocatingNewFeature = function(eventName, from, to) {
        shareabout.hint.remove();
        if (to != "loadingNewFeatureForm"){
          $("#crosshair").remove();
          map.removeLayer(shareabout.newFeature);
        }
      };

      /*
       * Removes all the layers related to feature submission.
       */
      fsm.oncancel = function (eventName, from, to) {
        $("#crosshair").remove();
        shareabout._removePopup();
        map.removeLayer(shareabout.newFeature);
      };

      /*
       *
       */
      fsm.onready = function (eventName, from, to) {
        shareabout._removePopup();

        shareabout.options.callbacks.onready();
      };
    }
  }; // end widget function return
})());