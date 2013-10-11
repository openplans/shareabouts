/*globals $ L*/

/*
 * L.Argo turns any GeoJSON data into a Leaflet layer.
 */

L.Argo = L.GeoJSON.extend({

  initialize: function (geojson, options) {
    // Set options
    L.Util.setOptions(this, options);
    L.Util.setOptions(this, {
      pointToLayer: this._pointToLayer,
      onEachFeature: this._onEachFeature
    });

    var successHandler = L.Util.bind(function(geojson) {
          this.addData(geojson);
          this.fire('loaded', {layer: this});
        }, this),
        errorHandler = L.Util.bind(function() {
          this.fire('error', {layer: this});
        }, this);

    // Init layers
    this._layers = {};

    // Just add data if this is an object
    if (geojson === Object(geojson)) {
      this.addData(geojson);
    } else if (typeof geojson === 'string') {
      // This is a url, go fetch the geojson
      if (this.options.type === 'geoserver') {
        // Handle geoserver specially
        this._getGeoJsonFromGeoServer(geojson, successHandler, errorHandler);
      } else {
        // Handle regular ajax
        this._getGeoJson(geojson, successHandler, errorHandler);
      }
    }
  },

  _pointToLayer: function (feature, latlng) {
    return new L.CircleMarker(latlng);
  },

  _onEachFeature: function(feature, layer) {
    var style = L.Argo.getStyleRule(feature.properties, this.rules).style,
        popupContent;

    if (this.popupContent) {
      popupContent = L.Argo.t(this.popupContent, feature.properties);
    }

    if (style) {
      // Only clickable if there is popup content; convert to bool
      style.clickable = !!popupContent;

      // Set the style manually since so I can use popupContent to set clickable
      layer.setStyle(style);

      // Handle radius for circle marker
      if (layer.setRadius && style.radius) {
        layer.setRadius(style.radius);
      }

      // Init the popup
      if (popupContent) {
        layer.bindPopup(popupContent);
      }
    } else {
      layer.setStyle({
        fill: false,
        stroke: false
      });
    }
  },

  _getGeoServerCallbackName: function() {
    var id = Math.floor(Math.random() * 0x10000).toString(16),
        callbackName = 'ArgoJsonpCallback_' + id + '_' + $.expando + '_' + $.now();

    return callbackName;
  },

  _getGeoJsonFromGeoServer: function(url, success, error) {
    var callbackName = this._getGeoServerCallbackName();

    // Fetch the GeoJson from GeoServer
    $.ajax({
      url: url + '&format_options=callback:' + callbackName,
      dataType: 'jsonp',
      jsonpCallback: callbackName,
      success: success,
      error: error
    });
  },
  _getGeoJson: function(url, success, error) {
    // Fetch the GeoJson using the given type
    $.ajax({
      url: url,
      dataType: this.options.type,
      success: success,
      error: error
    });
  }
});

L.extend(L.Argo, {
  // http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
  t: function t(str, obj){
    function find(obj, key) {
      var parts, partKey;
      if (!obj) {
        return obj;
      }

      if (key.indexOf('.') > -1) {
        parts = key.split('.');
        partKey = parts.shift();
        return find(obj[partKey], parts.join('.'));
      } else {
        return obj[key];
      }
    }

    var regex = /\{\{ *([\w\.]+) *\}\}/g,
        matches = str.match(regex),
        val, m, i;

    if (matches) {
      for (i=0; i<matches.length; i++) {
        m = matches[i].replace(/[\{\}]/g, '');
        val = find(obj, m);

        str=str.replace(new RegExp(matches[i], 'g'), val);
      }
    }

    return str;
  },

  // Get the style rule for this feature by evaluating the condition option
  getStyleRule: function(properties, rules) {
    var self = this,
        i, condition, len;

    for (i=0, len=rules.length; i<len; i++) {
      // Replace the template with the property variable, not the value.
      // this is so we don't have to worry about strings vs nums.
      condition = L.Argo.t(rules[i].condition, properties);

      // Simpler code plus a trusted source; negligible performance hit
      if (eval(condition)) {
        return rules[i];
      }
    }
    return null;
  }
});

L.argo = function (geojson, options) {
  return new L.Argo(geojson, options);
};
