Shareabouts.Util = {
  /**
   * @param {L.LatLng} latlng The location to translate to query string
   */
  latLngToQueryString: function(latlng) {
    return "latitude=" + latlng.lat + "&longitude=" + latlng.lng;
  }
};