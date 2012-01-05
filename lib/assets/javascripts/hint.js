var Hint = (function () {
  
  // Constructor & Public methods  
  var init = function (element, map) {
    var hint;
    this.mapElement = element;
    this.map        = map;
    
    // Public methods!
    
    /*
     * Shows the hint.
     * @param {String} label text to display within the hint
     * @param {Boolean} smallScreen hint will be centered if the screen is "small"
     * @param {L.Marker} layer marker at which to point hint. optional
     */
    this.open = function(label, smallScreen, layer) {
      var latlng = layer && layer._visible ? layer.getLatLng() : null;
      
      if (smallScreen || !latlng){
        hint = $("<div>").attr("class", "mobile-hint-overlay").html(label);
        this.mapElement.append(hint);
      } else {
        hint = new L.LabelOverlay(latlng, label);
        this.map.addLayer(hint);
      }
    };
    
    /* 
     * Removes the hint
     */
    this.remove = function() {
      if (hint && hint._opened) this.map.removeLayer(hint);      
      $(".mobile-hint-overlay").remove();
    };
  };
  
  return init;
})();