/*
 * requires leaflet, jquery 1.1.4, jakesgordon/javascript-state-machine
 */ 
var SocialGeo = (function () {
    
  var init = function (cfg) {
    var map, // leaflet map
        fsm, // state machin
        newFeature, // marker for proposed feature
        config = { 
          map : {
            tileUrl            : null, 
            center             : null,
            // optional
            mapElementId       : 'map', 
            tileAttribution    : '', 
            maxZoom            : 18,
            initialZoom        : 13
          },
          callbacks : {}, // state machine callbacks
          confirmationDialog : ''
        }

    $.extend(true, config, cfg);

    // Initializing map 
    map = new L.Map( config.map.mapElementId );
    map.setView(config.map.center, config.map.initialZoom);
    map.addLayer(new L.TileLayer( config.map.tileUrl, {
      maxZoom: config.map.maxZoom, attribution: config.map.tileAttribution
    }));
    
    /*
     * Returns the leaflet map
     */
    this.getMap = function () { return map; };
    
    /*
     * Returns the state machine object
     */
    this.getFSM = function () { return fsm; };
    
    // State machine handles the flow of creating and viewing map features
    fsm = StateMachine.create({
      initial : 'empty',
      events  : [
        { name: 'loadFeatures',    from: 'empty',             to: 'ready' },
        { name: 'locateFeature',   from: 'ready',             to: 'locatingFeature' },
        { name: 'finalizeFeature', from: 'locatingFeature',   to: 'finalizingFeature' },
        { name: 'submitFeature',   from: 'finalizingFeature', to: 'confirmingFeature' },
        { name: 'viewFeature',     from: 'ready',             to: 'viewingFeature' },
        { name: 'reset', from: ['locatingFeature', 'finalizingFeature', 'confirmingFeature', 'viewingFeature'], to: 'ready' }
      ], 
      callbacks : config.callbacks
    });

    fsm.onchangestate = function(eventName, from, to) { 
      console.log("Transitioning from " + from + " to " + to + " via " + eventName);
    };
    
    /*
     * Drops a marker on the map at the latlng, if provided, or in the middle
     */
    fsm.onlocatingFeature = function (eventName, from, to, latlng) {      
      if (!latlng) latlng = map.getCenter();
      newFeature = new L.Marker(latlng);
      map.addLayer(newFeature);
    };
    
    /*
     * Displays feature confirmation form of unsaved feature
     */
    fsm.onfinalizingFeature = function (eventName, from, to) {      
      newFeature.bindPopup(config.confirmationDialog).openPopup();
    };
    
    fsm.loadFeatures(); // 
    
  };

  return init;
})();

var social;
$(function(){
  var initFeatureLocation    = $("#initiateLocation"),
      confirmFeatureLocation = $("#confirmLocation");
      
  var greenpoint = new L.LatLng(40.727857, -73.947151);
  
  social = new SocialGeo({
    map : {
      tileUrl            : 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
      tileAttribution    : 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
      center             : greenpoint
    },
    callbacks : {
      onready : function(something) {
        initFeatureLocation.show();
        confirmFeatureLocation.hide();
      }
    },
    confirmationDialog : '<button type="button">confirm</button>'
  });
  
  var map = social.getMap();
  
  // Wire up the event triggers. These wirings should only deal with view-specificities.
  initFeatureLocation.click( function(event) { 
    social.getFSM().locateFeature();
    $(this).hide();
    confirmFeatureLocation.show();
  });
  
  confirmFeatureLocation.click( function(event) { 
    social.getFSM().finalizeFeature();
  });  
});