var Hint = (function () {

  // Constructor & Public methods
  var init = function (mapContainer, map) {
    // We use the element for small screen hints
    this.element = $("<div>").attr("class", "mobile-hint-overlay").css("display", "none").appendTo(mapContainer);

    // Overlay is used to point at a particular layer on non-small screens
    this.overlay = new L.LabelOverlay(map);

    // Public methods!

    /*
     * Shows the hint.
     * @param {String} label text to display within the hint
     * @param {Boolean} smallScreen hint will be centered if the screen is "small"
     * @param {L.Marker} layer marker at which to point hint. optional
     */
    this.open = function(label, smallScreen, layer) {
      var latlng = layer && layer._visible ? layer.getLatLng() : null;

      if (this._centerHint(smallScreen, latlng)) {
        this.active = this.element;
      } else {
        this.active = this.overlay;
        this.overlay.setLatLng(latlng);
      }
      this.active.html(label);
      this.active.show();
    };

    /*
     * Hides the hint.
     */
    this.remove = function() {
      if (this.active && this.active.hide) {
        this.active.hide();
      }
    };

    // Private methods!

    this._centerHint = function(smallScreen, latlng) {
      return (smallScreen || !latlng);
    };
  };

  return init;
})();