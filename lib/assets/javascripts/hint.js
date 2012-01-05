var Hint = (function () {
  
  // Constructor & Public methods  
  var init = function (element, map) {
    var hint;
    this.mapElement = element;
    this.map        = map;
    
    // Public methods!
    
    /*
     * Shows the hint
     */
    this.open = function(label, latlng, smallScreen) {
      // formerly showHint
      if (smallScreen || !latlng){
        hint = $("<div>").attr("class", "mobile-hint-overlay").html(label);
        this.mapElement.append(hint);
      } else {
        //
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