/*
 * requires leaflet, jquery 1.1.4, jakesgordon/javascript-state-machine, mustache
 */ 
var SocialGeo = (function () {
    
  var init = function (cfg) {
    var map, // leaflet map
        fsm, // state machin
        newFeature, // marker for proposed feature
        features = {},
        config = { 
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
          finalizeFeatureContent  : '', // form elements (not the form) [,confirm msg...] for submit feature
          featurePopupTemplate : '', 
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
      // If a popup is removed (closed), reset the map state
      if (e.layer instanceof L.Popup && fsm.can("reset")) fsm.reset();
    });
    
    /**
     * Returns the leaflet map
     */
    this.getMap = function () { return map; };
    
    /**
     * Returns the state machine object
     */
    this.getFSM = function () { return fsm; };
    
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
          featureparse.layer.bindPopup($.mustache( config.featurePopupTemplate, featureparse.properties ));

          var fId = featureparse.properties.id;

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
    
    
    // Upon submittal of the new feature form, begin transition to confirmingFeature
    $(".socialgeo-finalize-feature").live("submit", function(event){
      event.preventDefault();
      // save this to the local data object // transform newFeature to regular marker
      
      var ajaxOptions = { data : $(this).serialize() };
      $.extend(true, ajaxOptions, config.ajax);
      
      fsm.submitFeature( ajaxOptions );      
    });
    
    // Load initial data
    fsm.loadFeatures(config.dataUrl);
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
      center             : greenpoint,
      markerIcon         : L.Icon.extend( {
        iconUrl     : 'http://a841-tfpweb.nyc.gov/bikeshare/wp-content/themes/bikeshare/images/dot.png',
        iconSize    : new L.Point(18,18),
        shadowSize    : new L.Point(18,18),
        iconAnchor  : new L.Point(9,9),
        popupAnchor : new L.Point(0,-2)
      }),
      newMarkerIcon      : L.Icon.extend( {
        iconUrl     : 'http://a841-tfpweb.nyc.gov/bikeshare/wp-content/themes/bikeshare/images/bikeshare-marker.png',
        shadowUrl   : 'http://a841-tfpweb.nyc.gov/bikeshare/wp-content/themes/bikeshare/images/bikeshare-marker-shadow.png',
        iconSize    : new L.Point(23,35),
        shadowSize  : new L.Point(45,35),
        iconAnchor  : new L.Point(12,35),
        popupAnchor : new L.Point(0,-33)
      }),
    },
    callbacks : {
      onready : function(something) {
        initFeatureLocation.show();
        confirmFeatureLocation.hide();
      }
    },
    ajax : {
      url : window.location.href
    },
    finalizeFeatureContent : 'this is the place!',
    dataUrl : 'http://demo.cartodb.com/api/v1/sql?q=select%20*%20from%20bikeshare_points%20limit%201000&format=geojson&callback=?',
    featurePopupTemplate : "\
      <div>\
        {{user_avatar_url}}<span>{{user_name}}</span> suggested this station in {{neighborhood}}.\
      </div> \
      <p>{{reason}}</p>\
      <p><a>Support</a> <span>{{ck_rating_up}}</span> Supporters</p>\
      <p><span>Share this station: </span>' + $fb_text + $tweet_text + $email_text + $direct_link + '</p>\
    "
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