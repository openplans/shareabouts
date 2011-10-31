/*
 * requires leaflet, jquery 1.1.4
 */ 
var SocialGeo = (function () {
    
  var init = function (opts) {
    var map, newFeature, options = {
      map : {
        tileUrl            : null, 
        center             : null,
        // optional
        mapElementId       : 'map', 
        tileAttribution    : '', 
        maxZoom            : 18,
        initialZoom        : 13
      },
      confirmationDialog : ''
    }

    $.extend(true, options, opts);

    // initializing map 
    map = new L.Map( options.map.mapElementId );
    map.setView(options.map.center, options.map.initialZoom);
    map.addLayer(new L.TileLayer( options.map.tileUrl, {
      maxZoom: options.map.maxZoom, attribution: options.map.tileAttribution
    }));
    
    /*
     * Returns the leaflet map
     */
    this.getMap = function () { return map; };
    
    /*
     * Drops a marker on the map at the latlng, if provided, or in the middle
     */
    this.dropMarker = function (event, latlng) {
      if (newFeature) return;
      
      if (!latlng) latlng = map.getCenter();
      newFeature = new L.Marker(latlng);
      map.addLayer(newFeature);
    };
    
    /*
     * Displays feature confirmation form of unsaved feature
     */
    this.confirmFeature = function (event) {
      if (!newFeature) return;
      
      newFeature.bindPopup(options.confirmationDialog).openPopup();
    };
    
    /*
     * Sets the content of the feature confirmation dialog
     */
    this.setConfirmationDialog = function (content) {
      options.confirmationDialog = content;
    };
  };
  
  return init;
})();

var social;
$(function(){
  var greenpoint = new L.LatLng(40.727857, -73.947151);
  
  social = new SocialGeo({
    map : {
      tileUrl            : 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
      tileAttribution    : 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
      center             : greenpoint
    },
    confirmationDialog : '<button type="button">confirm</button>'
  });
  
  var map = social.getMap();
  
  $("#initiateLocation").click(social.dropMarker);
  $("#confirmLocation").click(social.confirmFeature);
});