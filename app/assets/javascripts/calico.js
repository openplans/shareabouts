/*
 * requires leaflet, jquery 1.1.4, jakesgordon/javascript-state-machine, mustache, history.js
 */ 
var Calico = (function () {
    
  var init = function (cfg) {
    var map, // leaflet map
        fsm, // state machin
        newFeature, // marker for proposed feature
        features = {},
        popup    = new L.Popup({ offset: new L.Point(0,-33)}),
        config   = { 
          map : {
            tileUrl            : null, 
            center             : null,
            // optional
            dataUrl            : null,
            mapElementId       : 'map', 
            tileAttribution    : '', 
            maxZoom            : 18,
            initialZoom        : 13,
            markerIcon         : null, // custom icon
            newMarkerIcon      : null // custom icon for markers representing unsaved features
          },
          featurePopupTemplate : '', 
          ajaxSubmitCfg : { // ajax config for new features
            type : 'POST',
            success : function(data) {
              fsm.confirmSubmission(data);
            }
          }, 
          callbacks : {} // state machine callbacks
        }

    $.extend(true, config, cfg);

    // Initializing map 
    map = new L.Map( config.map.mapElementId );
    
    map.setView(config.map.center, config.map.initialZoom);
    
    map.addLayer(new L.TileLayer( config.map.tileUrl, {
      maxZoom: config.map.maxZoom, attribution: config.map.tileAttribution
    }));
    
    map.on('layerremove', function(e){
      // When the popup is removed (closed), reset the map state
      if (e.layer == popup && fsm.can("reset")) fsm.reset();
    });
        
    /**
     * Returns the leaflet map
     */
    this.getMap = function () { return map; };
    
    /**
     * Returns the state machine object
     */
    this.state = function () { return fsm; };
    
    /**
     * Opens the popup for a feature
     */
    this.viewFeature = function(fId) {
      features[fId].openPopup();
    };
    
    // State machine handles the flow of creating and viewing map features
    fsm = StateMachine.create({
      initial : 'empty',
      events  : [
        { name: 'loadFeatures',      from: ['empty', 'ready'],  to: 'ready' },
        { name: 'locateFeature',     from: 'ready',             to: 'locatingFeature' },
        { name: 'finalizeFeature',   from: 'locatingFeature',   to: 'finalizingFeature' },
        { name: 'submitFeature',     from: 'finalizingFeature', to: 'submittingFeature' },
        { name: 'confirmSubmission', from: 'submittingFeature', to: 'confirmingSubmission' },
        { name: 'viewFeature',       from: 'ready',             to: 'viewingFeature' },
        { name: 'reset', from: ['locatingFeature', 'finalizingFeature', 'confirmingSubmission', 'viewingFeature'], to: 'ready' }
      ], 
      callbacks : config.callbacks
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
            if ( config.map.markerIcon ) markerOpts.icon = new config.map.markerIcon();
            return new L.Marker(latlng, markerOpts);
          }
        });
        
        // Triggered as features are individually parsed
        geojsonLayer.on('featureparse', function(featureparse) {
          featureparse.layer._html = $.mustache( config.featurePopupTemplate, featureparse.properties );

          var fId = featureparse.properties.id;

          featureparse.layer.on("click", function(click) {
            // Change history state on feature click
            History.pushState( { featureId : fId }, "Feature " + fId, "?feature=" + fId);   
          });
          
          // Add feature layer to features object
          features[fId] = featureparse.layer;
        });
        
        if (typeof data == "object") data = data.features;
        $.each(data, function(i,f) { geojsonLayer.addGeoJSON(f); });
        map.addLayer(geojsonLayer);
      });      
    }
    
    /*
     * Drops a marker on the map at the latlng, if provided, or in the middle
     */
    fsm.onenterlocatingFeature = function (eventName, from, to, latlng) {      
      if (!latlng) latlng = map.getCenter();
      var markerOpts = { draggable : true };
      if ( config.map.newMarkerIcon ) markerOpts.icon = new config.map.newMarkerIcon();
        
      newFeature = new L.Marker(latlng, markerOpts);
      map.addLayer(newFeature);
    };
    
    /*
     * Performs an ajax request. 
     * If the json response contains a view property, that will be displayed in the marker popup.
     */
    fsm.onleavelocatingFeature = function (eventName, from, to, options) {
      newFeature.dragging.disable();
      if ( typeof options == "object" ){
        $.extend(true, options, { 
          type : 'GET', 
          success: function(data){
            if (data.view) {
              openPopupFor(newFeature, $("<div>").html($("<div class='calico submit'>").html(data.view)).html());
              $("div.calico.submit form").submit(function(e){
                e.preventDefault();
                                
                var ajaxOptions = { 
                  data : $(this).serialize() + "&lat=" + newFeature.getLatLng().lat + "&lng=" + newFeature.getLatLng().lng, 
                  url : $(this).attr("action") 
                };
                
                $.extend(true, ajaxOptions, config.ajaxSubmitCfg);

                fsm.submitFeature( ajaxOptions );
              });
            }
            fsm.transition();
          },
          dataType : 'json'
        });
        $.ajax(options);
      }
      return false;
    };
    
    /*
     * Submits new feature form. 
     * Wait until response to transition to confirmingFeature state.
     */
    fsm.onentersubmittingFeature = function (eventName, from, to, ajaxCfg) {
      $.ajax(ajaxCfg);
    };
    
    /*
     * Displays responseData.view in popup. 
     */
    fsm.onenterconfirmingSubmission = function (eventName, from, to, responseData) {
      openPopupFor( newFeature, responseData.view);
    };
    
    /*
     *
     */
    fsm.onleaveconfirmingSubmission = function (eventName, from, to) {
      var markerOpts = { };
      if ( config.map.markerIcon ) markerOpts.icon = new config.map.markerIcon();
      
      var marker = new L.Marker(newFeature.getLatLng(), markerOpts);
      map.addLayer(marker); 
    };
    
    /*
     * Removes all the layers related to feature submission. 
     */
    fsm.onreset = function (eventName, from, to) {
      newFeature.closePopup();
      map.removeLayer(newFeature);
    };
    
    // Load initial data
    fsm.loadFeatures(config.dataUrl);
    
    History.Adapter.bind(window,'statechange',function(){
      var State = History.getState();
      if (State.data.featureId) {
        var featureLayer = features[State.data.featureId];
        openPopupFor( featureLayer, featureLayer._html);
      }
    });
    
    var openPopupFor = function(layer, content) {
      popup.setContent(content);
      popup.setLatLng(layer.getLatLng());
      if (!popup._opened) map.openPopup(popup);
    };
  };

  return init;
})();