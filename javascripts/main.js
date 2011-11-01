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
          finalizeFeatureContent  : '', // form elements (not the form) [,confirm msg...] for submit feature
          ajax : { // ajax config for new features
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
      if (e.layer instanceof L.Popup && fsm.can("reset")) fsm.reset();
    })
    
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
        { name: 'loadFeatures',      from: 'empty',             to: 'ready' },
        { name: 'locateFeature',     from: 'ready',             to: 'locatingFeature' },
        { name: 'finalizeFeature',   from: 'locatingFeature',   to: 'finalizingFeature' },
        { name: 'submitFeature',     from: 'finalizingFeature', to: 'submittingFeature' },
        { name: 'confirmSubmission', from: 'submittingFeature', to: 'confirmingSubmission' },
        { name: 'viewFeature',       from: 'ready',             to: 'viewingFeature' },
        { name: 'reset', from: ['locatingFeature', 'finalizingFeature', 'submittingFeature', 'confirmingSubmission', 'viewingFeature'], to: 'ready' }
      ], 
      callbacks : config.callbacks
    });

    fsm.onchangestate = function(eventName, from, to) { 
      console.log("Transitioning from " + from + " to " + to + " via " + eventName);
    };
    
    /*
     * Drops a marker on the map at the latlng, if provided, or in the middle
     */
    fsm.onenterlocatingFeature = function (eventName, from, to, latlng) {      
      if (!latlng) latlng = map.getCenter();
      newFeature = new L.Marker(latlng, { draggable : true });
      map.addLayer(newFeature);
    };
    
    /*
     * Displays feature finalization form of unsaved feature
     */
    fsm.onenterfinalizingFeature = function (eventName, from, to) {
      newFeature.dragging.disable();
      var form = $(finalizeForm).prepend(config.finalizeFeatureContent).wrap('<div>').parent().html();
      newFeature.bindPopup(form).openPopup();
    };
    
    /*
     * Submits new feature form. 
     * Wait until response to transition to confirmingFeature state.
     */
    fsm.onentersubmittingFeature = function (eventName, from, to, ajaxCfg) {
      $.ajax(ajaxCfg);
    };
    
    /*
     * Displays response in popup. 
     */
    fsm.onenterconfirmingSubmission = function (eventName, from, to, responseData) {
      newFeature._popup.setContent(responseData);
    };
    
    /*
     * Removes all the layers related to feature submission. 
     */
    fsm.onreset = function (eventName, from, to) {
      newFeature.closePopup();
      map.removeLayer(newFeature);
      
    };
    
    // Upon submittal of the new feature form, begin transition to confirmingFeature
    $(".socialgeo-finalize-feature").live("submit", function(event){
      event.preventDefault();
      // save this to the local data object // transform newFeature to regular marker
      
      var ajaxOptions = { data : $(this).serialize() };
      $.extend(true, ajaxOptions, config.ajax);
      
      fsm.submitFeature( ajaxOptions );      
    });
    
    fsm.loadFeatures(); //
    
  };
  
  var finalizeForm = "\
    <form class='socialgeo-finalize-feature'>\
      <button type='submit'>confirm</button>\
    <form>\
  ";  

  return init;
})();

var social;
$(function(){
  var initFeatureLocation    = $("#initiateLocation"),
      confirmFeatureLocation = $("#confirmLocation"),
      reset                  = $("#reset");
      
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
    finalizeFeatureContent : 'this is the place!', 
    ajax : {
      url : window.location.href
    }
  });
  
  var map = social.getMap();
  
  // Wire up the event triggers. These wirings should only deal with view-specificities.
  initFeatureLocation.click( function(event) { 
    social.getFSM().locateFeature();
    $(this).hide();
    confirmFeatureLocation.show();
  });
  
  confirmFeatureLocation.click( function(event) { 
    $(this).hide();
    social.getFSM().finalizeFeature();
  });
  
  reset.click( function(event) {
    social.getFSM().reset();
  });
});