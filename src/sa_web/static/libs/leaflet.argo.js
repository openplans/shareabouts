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
      console.log("creating circle marker at: ");
      console.log(latlng);
    return new L.CircleMarker(latlng);
  },

  _onEachFeature: function(feature, layer) {
    var style = L.Argo.getStyleRule(feature.properties, this.rules).style,
//    var style = L.Argo.getStyleRule(feature.properties, this.rules),
        popupContent;
//    var style = L.Argo.getStyleRule(feature, this.rules).style,
//        popupContent;

    if (this.popupContent) {
      popupContent = L.Argo.t(this.popupContent, feature.properties);
    }

    if (style) {
      // Only clickable if there is popup content; convert to bool
      style.clickable = !!popupContent;


      // Set the style manually since so I can use popupContent to set clickable
//        if (feature.hasOwnProperty('geometry') && feature['geometry'].hasOwnProperty('type') && feature['geometry']['type'] == 'Polygon')
        // check for a Mapbox Polygon layer
//        console.log("Setting layer's style in '_onEachFeature':");
        console.log("style:");
        console.log(style);
        console.log("feature.properties:");
        console.log(feature.properties);

//        console.log("Layer:");
//        console.log(layer);
//        console.log("feature:");
//        console.log(feature);
//
//        console.log("feature[properites]:");
//        console.log(feature['properties']);
//        console.log("feature[properites][fill]:");
//        console.log(feature['properties']['fill']);

//        var properties = feature['properties'];
//
////        var originalColor = style['fillColor'];
//        var originalFillColor = style['fillColor'];
//        if (properties.hasOwnProperty('fill') && originalFillColor == '{{fill}}') {
//            console.log("Changing the fill color to geojson specified value...");
////            style['color'] = properties.fill;
//            style['fillColor'] = properties.fill;
//        }
//
//        var originalStrokeColor = style['color'];
//        if (properties.hasOwnProperty('stroke') && originalStrokeColor == '{{stroke}}') {
//            console.log("Changing the stroke color to geojson specified value...");
////            style['color'] = properties.fill;
//            style['color'] = properties['stroke'];
//        }
//
//        var originalFillOpacity = style['fillOpacity'];
////        console.log("properties:");
////        console.log(properties);
////        console.log("properties['fill-opacity']:");
////        console.log(properties['fill-opacity']);
//        if (properties.hasOwnProperty('fill-opacity') && originalFillOpacity == '{{fill-opacity}}') {
//            console.log("Changing the fill opacity to geojson specified value...");
//            style['fillOpacity'] = properties['fill-opacity'];
//        }
//
//        var originalStrokeWidth = style['weight'];
////        console.log("properties:");
////        console.log(properties);
////        console.log("properties['fill-opacity']:");
////        console.log(properties['fill-opacity']);
//        if (properties.hasOwnProperty('stroke-width') && originalStrokeWidth == '{{stroke-width}}') {
//            console.log("Changing the weight to geojson specified value...");
//            style['weight'] = properties['stroke-width'];
//        }

      layer.setStyle(style);
//        style['color'] = originalColor;
//        style['fillColor'] = originalFillColor;
//        style['color'] = originalStrokeColor;
//        style['fillOpacity'] = originalFillOpacity;
//        style['weight'] = originalStrokeWidth;

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
//      console.log("inside function 't'");
//      console.log("str:");
//      console.log(str);
//      console.log("obj:");
//      console.log(obj);

    function find(obj, key) {
//        console.log("inside 'find'");
//        console.log("obj:");
//        console.log(obj);
//        console.log("key:");
//        console.log(key);
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

    var regex = /\{\{ *([\w\.-]+) *\}\}/g,
        matches = str.match(regex),
        val, m, i;
//      console.log("matches:");
//      console.log(matches);

    if (matches) {
      for (i=0; i<matches.length; i++) {
        m = matches[i].replace(/[\{\}]/g, '');
        val = find(obj, m);
//          console.log("val:");
//          console.log(val);

        str=str.replace(new RegExp(matches[i], 'g'), val);
//          console.log("returned str:");
//          console.log(str);
      }
    }

    return str;
  },

  // Get the style rule for this feature by evaluating the condition option
  getStyleRule: function(properties, rules) {
    var self = this,
        i, condition, len;

//      console.log("caller is " + arguments.callee.caller.toString());
      console.log("rules:");
      console.log(rules);

    for (i=0, len=rules.length; i<len; i++) {
      // Replace the template with the property variable, not the value.
      // this is so we don't have to worry about strings vs nums.
      condition = L.Argo.t(rules[i].condition, properties);
//        console.log("testing style rule for feature: " + i);
//        console.log("properties:");
//        console.log(properties);
//        console.log("condition:");
//        console.log(condition);

        if (eval(condition)) {
            // Replace the property key-values with the feature specific values
            for (var key in rules[i].style) {
                if (rules[i].style.hasOwnProperty(key)) {
                    if (typeof rules[i].style[key] == 'string' || rules[i].style[key] instanceof String) {
                        value = L.Argo.t(rules[i].style[key], properties);
//                    console.log("Translated properties:");
//                    console.log(test);
                        properties[key] = value;
                    } else {
                        properties[key] = rules[i].style[key];
                    }
                } else {
                    console.log("Non-property key is discovered at: " + key);
                }
            }

//            rules[i]['style'] = properties;
//            console.log("Condition passes, evaluating style rule...");
            properties = {'style' : properties};

            if (rules[i].icon) {
                if (rules[i].isFocused && rules[i].focus_icon) {
                    properties.focus_icon = rules[i].focus_icon;
                } else {
                    properties.icon = rules[i].icon;
                }
//                this.layer = (this.isFocused && this.styleRule.focus_icon ?
//                    L.marker(this.latLng, {icon: L.icon(this.styleRule.focus_icon)}) :
//                    L.marker(this.latLng, {icon: L.icon(this.styleRule.icon)}));
            }
            return properties;
//            return rules[i];
        }
    }
    return null;
  }
});

L.argo = function (geojson, options) {
  return new L.Argo(geojson, options);
};
