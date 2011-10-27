/*
 * requires leaflet
 */ 
var SocialGeo = (function () {
  var map;
  
  var init = function (opts) {
    var options = {
      mapElementId       : null, 
      tileUrl            : null, 
      // optional
      confirmationDialog : '',
      tileAttribution    : '', 
      maxZoom            : 18,
      initialZoom        : 13,
      center             : null
    }
    
    var newLocation;
        
    for (var a in (opts || {})) { options[a] = opts[a]; }
        
    map = new L.Map( options.mapElementId );
            
    if (options.center) map.setView(options.center, options.initialZoom)
      .addLayer(new L.TileLayer( options.tileUrl, {
        maxZoom: options.maxZoom, attribution: options.tileAttribution
      }));
    
    /*
     * Returns the leaflet map
     */
    this.getMap = function () { return map; };
    
    /*
     * Drops a marker on the map at the latlng, if provided, or in the middle
     */
    this.dropMarker = function (event, latlng) {
      if (newLocation) return;
      
      if (!latlng) latlng = map.getCenter();
      newLocation = new L.Marker(latlng);
      map.addLayer(newLocation);
    };
    
    /*
     * Displays location confirmation form of unsaved location
     */
    this.confirmLocation = function (event) {
      if (!newLocation) return;
      
      newLocation.bindPopup(options.confirmationDialog).openPopup();
    };
    
    /*
     * Sets the content of the location confirmation dialog
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
    mapElementId       : 'map', 
    tileUrl            : 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
    tileAttribution    : 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
    center             : greenpoint,
    confirmationDialog : '<button type="button">confirm</button>'
  });
  
  var map = social.getMap();
  
  $("#initiateLocation").click(social.dropMarker);
  $("#confirmLocation").click(social.confirmLocation);
});