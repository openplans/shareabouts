var Argo = Argo || {};

(function(A, $) {
  // Update _ templates to be like mustache
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };

  // A Legend for all of the layers
  A.LegendView = Backbone.View.extend({
    initialize: function(){
      this.render();
    },
    events: {
      'change .argo-legend-checkbox': 'toggleVisibility'
    },
    render: function(){
      var $markup = $('<ul class="argo-legend-list"></ul>');

      this.collection.each(function(model, i) {
        var checked = model.get('visible') ? 'checked="checked"' : '';

        if (model.get('legend') !== false) {
          $markup.append('<li class="argo-legend-item">' +
            '<div class="argo-legend-desc">' +
              '<div class="argo-legend-desc-title">'+model.get('title')+'</div>' +
              '<div class="argo-legend-desc-content">'+model.get('description')+'</div>' +
            '</div>' +
            '<div class="argo-legend-title">' +
              '<input id="argo-'+model.get('id')+'" data-layerid="'+model.get('id')+'" ' +
                checked+' class="argo-legend-checkbox" type="checkbox"></input>' +
              '<label for="argo-'+model.get('id')+'">'+model.get('title')+'</label>' +
            '</div>' +
          '</li>');
        }
      });

      this.$el.append($markup);
    },
    toggleVisibility: function(evt) {
      var $cbox = $(evt.target),
          id = $cbox.attr('data-layerid');

      if ($cbox.is(':checked')) {
        this.collection.get(id).set('visible', true);
      } else {
        this.collection.get(id).set('visible', false);
      }
    }
  });

  // A view for stylable GeoJson layers
  A.LayerView = Backbone.View.extend({
    initialize: function(){
      var self = this,
          url = self.model.get('url'),
          type = self.model.get('type') || 'jsonp',
          getGeoJsonFunction = type === 'geoserver' ?
            self.getGeoJsonFromGeoServer : self.getGeoJson;

      // Cache the popup template
      if (self.model.has('popupContent')) {
        self.popupTemplate = _.template(self.model.get('popupContent'));
      }

      getGeoJsonFunction.call(this, url, self.model.toJSON(), function(geoJson) {
        if (geoJson) {
          self.layer = L.geoJson(geoJson, {
            pointToLayer: function (feature, latlng) {
              return new L.CircleMarker(latlng);
            },
            onEachFeature: function(feature, layer) {
              var style = self.getStyleRule(feature.properties),
                  popupContent = self.getPopupContent(feature.properties);

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
            }
          });

          self.render();
        } else {
          console.error('GeoJSON could not be retrieved from: ', url);
        }
      });

      // Rerender on model change
      self.model.bind('change', self.render, self);
    },

    getGeoServerCallbackName: function(id) {
      // Get rid of any invalid characters for a JS var
      var safeId = id.replace(/[^\w\d]/g, ''),
          callbackName = 'ArgoJsonpCallback_' + safeId + '_' + $.expando + '_' + $.now();

      return callbackName;
    },

    getGeoJsonFromGeoServer: function(url, options, callback) {
      var callbackName = this.getGeoServerCallbackName(options.id);

      // Fetch the GeoJson from GeoServer
      $.ajax({
        url: url + '&format_options=callback:' + callbackName,
        dataType: 'jsonp',
        jsonpCallback: callbackName,
        success: callback
      });
    },
    getGeoJson: function(url, options, callback) {
      // Fetch the GeoJson using the given type
      $.ajax({
        url: url,
        dataType: options.type,
        success: callback
      });
    },
    // Get the style rule for this feature by evaluating the condition option
    getStyleRule: function(properties) {
      var self = this,
          rules = self.model.get('rules'),
          i, condition;

      for (i=0; i<rules.length; i++) {
        // Replace the template with the property variable, not the value.
        // this is so we don't have to worry about strings vs nums.
        condition = _.template(rules[i].condition)(properties);

        // Simpler code plus a trusted source; negligible performance hit
        if (eval(condition)) {
          return rules[i].style;
        }
      }
      return null;
    },
    // Get the popup content and replace the variable
    getPopupContent: function(properties) {
      return this.popupTemplate ? this.popupTemplate(properties) : null;
    },
    render: function(){
      // Adds or removes the layer based on visibility
      this.options.map.closePopup();
      if (this.model.get('visible') && !this.options.map.hasLayer(this.layer)) {
        this.options.map.addLayer(this.layer);
      }
      if (!this.model.get('visible') && this.options.map.hasLayer(this.layer)) {
        this.options.map.removeLayer(this.layer);
      }
    }
  });

  // A view for maps with a legend and stylable GeoJson layers
  A.MapView = Backbone.View.extend({
    initialize: function() {
      var self = this,
          i, layerModel,
          // Base layer config is optional, default to Mapbox Streets
          baseLayerConfig = _.extend({
            url: 'http://{s}.tiles.mapbox.com/v3/openplans.map-dmar86ym/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors, CC-BY-SA. <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
          }, self.options.baseLayer),
          baseLayer = new L.TileLayer(baseLayerConfig.url, baseLayerConfig);

      // Init the map
      self.map = new L.Map(self.el, self.options.map);
      self.map.addLayer(baseLayer);
      // Remove default prefix
      self.map.attributionControl.setPrefix('');

      // Cache the layers views
      self.layers = {};

      // Init all of the layers
      this.collection.each(function(model, i) {
        self.layers[model.get('id')] = new A.LayerView({
          map: self.map,
          model: model
        });
      });
    }
  });
})(Argo, jQuery);