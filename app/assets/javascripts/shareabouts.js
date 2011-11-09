/*
 * requires leaflet, jquery 1.1.4, mustache, history.js
 */ 
$.widget("ui.shareabout", (function() {
  var map, // leaflet map
      fsm, // state machine
      newFeature, // marker for proposed feature
      features, // object that stores map features by their ID
      popup; // one popup on the map
    
  return {
    options : {
      map : {
        tileUrl            : null, 
        center             : null,
        // optional
        tileAttribution    : '', 
        maxZoom            : 18,
        initialZoom        : 13,
        markerIcon         : null, // custom icon
        newMarkerIcon      : null // custom icon for markers representing unsaved features
      },
      dataUrl              : null,
      featurePopupTemplate : null, 
      callbacks : {} // state machine callbacks
    },
  
    /**
     * Constructor
     */
    _create : function() {
      features = {};
      popup    = new L.Popup({ offset: new L.Point(0,-33)});
      map      = new L.Map( this.element.attr("id") );

      map.setView(this.options.map.center, this.options.map.initialZoom);

      map.addLayer(new L.TileLayer( this.options.map.tileUrl, {
        maxZoom: this.options.map.maxZoom, attribution: this.options.map.tileAttribution
      }));

      map.on('layerremove', function(e){
        // When the popup is removed (closed), reset the map state
        if (e.layer == popup && fsm.can("reset")) fsm.reset();
      });
    
      this._init_states();
    
      History.Adapter.bind(window,'statechange',function(){
        var State = History.getState();
        if (State.data.featureId) {
          var featureLayer = features[State.data.featureId];
          if (featureLayer._html) openPopupFor( featureLayer, featureLayer._html);
        }
      });
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
     * Unless otherwise specified via success callback, loads form into popup for newFeature marker.
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
     * Returns the leaflet map
     */
    getMap : function () { return map; },
  
    /**
     * Returns the state machine object
     */
    state : function () { return fsm; },
    
    /**
     * Returns the new Feature marker
     */
    getNewFeatureMarker : function () { return newFeature },
  
    /**
     * Opens the popup for a feature
     */
    viewFeature : function(fId, view) {
      this.openPopupFor( features[fId], view ? view : featureLayer._html);
    },
  
    // fixing ...
    openPopupFor : function(layer, content) {
      popup.setContent(content);
      popup.setLatLng(layer.getLatLng());
      if (!popup._opened) map.openPopup(popup);
    },
  
    _setupMarker : function(marker, properties) {
      if (this.options.featurePopupTemplate)
        marker._html = $.mustache( this.options.featurePopupTemplate, properties );

      var fId = properties.id;
    
      marker._id = fId;
      marker.on("click", this._markerClick);
    
      features[fId] = marker;
    },
  
    _markerClick : function(click) {
      // Change history state on feature click
      var fId = this._id;
      History.pushState( { featureId : fId }, "Feature " + fId, "?feature=" + fId);   
    },
  
    /*
     * Private
     */
    _init_states : function() {
      var shareabout = this;
      
      // State machine handles the flow of creating and viewing map features
      fsm = StateMachine.create({
        initial : 'ready',
        events  : [
          // if geoJSON object or data url in options
          { name: 'loadFeatures', from: 'ready', to: 'loadingFeatures'},
          // UI triggered. drops a marker onto the map. if passed L.LatLng, drops marker there.
          { name: 'locateNewFeature', from: 'ready', to: 'locatingNewFeature'},
          // UI triggered. can move from ready to loadingNewFeatureForm without first locating if location not required, chosen later, etc
          // if feature is already located, pass geoJSON representation of feature to loadNewFeatureForm
          { name: 'loadNewFeatureForm', from: ['ready', 'locatingNewFeature'], to: 'loadingNewFeatureForm'},
          // called internally after form has been loaded
          { name: 'finalizeNewFeature', from: 'loadingNewFeatureForm', to: 'finalizingNewFeature'},
          // UI triggered. pass geoJSON representation to transition and callback on success
          { name: 'submitNewFeature', from: ['finalizingNewFeature', 'locatingNewFeature'], to: 'submittingNewFeature'},

          // Ways to get back to ready
          { name: 'ready', from : ['loadingFeatures', 'submittingNewFeature'], to: 'ready'},
          { name: 'cancel', from: ['locatingNewFeature', 'finalizingNewFeature'], to: 'ready'}
        ], 
        callbacks : shareabout.options.callbacks
      });
    
      fsm.onchangestate = function(eventName, from, to) { 
        console.log("Transitioning from " + from + " to " + to + " via " + eventName);
      };

      /*
       * Expects a geoJSON object or an array of geoJSON features whose properties contain a unique ID called 'id'
       */
      fsm.onloadFeatures = function (eventName, from, to, dataUrl) {
        if (!dataUrl) return;

        $.getJSON(dataUrl, function(data){
          var geojsonLayer = new L.GeoJSON(null, {
            // Assumes all features are points ATM
            pointToLayer : function(latlng) {
              var markerOpts = {};
              if ( shareabout.options.map.markerIcon ) markerOpts.icon = new shareabout.options.map.markerIcon();
              return new L.Marker(latlng, markerOpts);
            }
          });

          // Triggered as features are individually parsed
          geojsonLayer.on('featureparse', function(featureparse) {
            shareabout._setupMarker(featureparse.layer, featureparse.properties);
          });

          if (typeof data == "object") data = data.features;
          $.each(data, function(i,f) { geojsonLayer.addGeoJSON(f); });
          map.addLayer(geojsonLayer);
          fsm.ready();
        });      
      }

      /*
       * Drops a marker on the map at the latlng, if provided, or in the middle
       */
      fsm.onlocateNewFeature = function (eventName, from, to, latlng) {   
        if (!latlng) latlng = map.getCenter();
        
        var markerOpts = { draggable : true };
        if ( shareabout.options.map.newMarkerIcon ) markerOpts.icon = new shareabout.options.map.newMarkerIcon();

        newFeature = new L.Marker(latlng, markerOpts);
        map.addLayer(newFeature);
      };
      
      /*
       * Performs an ajax request. 
       * By default, if the json response contains a view property, that will be displayed in the marker popup.
       */
      fsm.onloadNewFeatureForm = function (eventName, from, to, ajaxOptions) {
        newFeature.dragging.disable();
        
        var ajaxCfg = { 
          type : 'GET', 
          success: function(data){
            if (data.view) {
              shareabout.openPopupFor(newFeature, $("<div>").html($("<div class='shareabouts submit'>").html(data.view)).html());
            }
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
             fsm.ready(data);
           }
         };
         if ( typeof ajaxOptions == "object" ) $.extend(true, ajaxCfg, ajaxOptions);
         $.ajax(ajaxCfg);
      };

      /*
       * Creates a marker for the new feature using the properties in responseData.geoJSON. 
       */
      fsm.onleaveconfirmingSubmission = function (eventName, from, to, responseData) {
        var markerOpts = { };
        if ( shareabout.options.map.markerIcon ) markerOpts.icon = new shareabout.options.map.markerIcon();

        var marker = new L.Marker(newFeature.getLatLng(), markerOpts);

        shareabout._setupMarker(marker, responseData.geoJSON.properties);

        map.removeLayer(newFeature);
        map.addLayer(marker);

        // Update history state 
        var fId = responseData.geoJSON.properties.id;
        History.pushState( { featureId : fId }, "Feature " + fId, "?feature=" + fId);   
      };

      /*
       * Removes all the layers related to feature submission. 
       */
      fsm.onreset = function (eventName, from, to) {
        newFeature.closePopup();
        map.removeLayer(newFeature);
      };

      // Load initial data
      fsm.loadFeatures(this.options.dataUrl);      
    }
  }; // end widget function return
})());