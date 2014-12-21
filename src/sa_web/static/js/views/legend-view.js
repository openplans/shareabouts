var Shareabouts = Shareabouts || {};

//(function(A, $) {
//  // A Legend for all of the layers
//  A.LegendView = function(options) {


(function(S, $, console){
  S.LegendView = Backbone.View.extend({
    initialize: function () {

      var this_ = {};
      var self = this;

      // Cache the root element
      this_.$el = $(self.options.el);

      // Render the legend
      this_.$el.append(self.render());

//      this_.$el.append($markup);

      // Bind the checkbox change event
      this_.$el.find('.map-legend-checkbox').on('change', self.toggleVisibility);

      console.log("self inside LegendView:");
      console.log(self);


    },

    render: function () {
      var $markup = $('<ul class="map-legend-list"></ul>'),
        i, checked, layer;

      for (i = 0; i < this.options.layers.length; i++) {
        layer = this.options.layers[i];
        checked = layer.visible ? 'checked="checked"' : '';

//        if (layer.legend !== false) {
        if (layer.legend == true) {
//          console.log("layer legend is true!");
//          console.log("layer.legend:");
//          console.log(layer.legend);
//          console.log("layer.url:");
//          console.log(layer.url);
          $markup.append('<li class="map-legend-item">' +
            '<div class="map-legend-desc">' +
            '<div class="map-legend-desc-title">' + layer.title + '</div>' +
            '<div class="map-legend-desc-content">' + layer.description + '</div>' +
            '</div>' +
            '<div class="map-legend-title">' +
            '<input id="map-' + layer.id + '" data-layerid="' + layer.id + '" ' +
            checked + ' class="map-legend-checkbox" type="checkbox"></input>' +
            '<label for="map-' + layer.id + '">' + layer.title + '</label>' +
//              '<input id="map-'+layer.id+'" data-layerid="'+layer.id+'" ' +
//                checked+' class="map-legend-checkbox" type="checkbox"></input>' +
//              '<label for="map-'+layer.id+'">'+layer.title+'</label>' +
            '</div>' +
            '</li>');
        }
      }
      return $markup;

//      this_.$el.append($markup);
    },

      // Checkbox change handler, triggers event to the MapView
//      function toggleVisibility(evt) {
    toggleVisibility: function(evt) {
      console.log("toggling visibility in legend-view");
      console.log("toggle visbility event is: ");
      console.log(evt);

      var $cbox = $(evt.target),
        id = $cbox.attr('data-layerid');

      console.log("toggle visibility cbox:");
      console.log($cbox);
      console.log("toggle visibility id: ");
      console.log(id);
      if ($cbox.is(':checked')) {
        $(S).trigger('visibility', [id, true]);
      } else {
        $(S).trigger('visibility', [id, false]);
      }
    }


//      console.log("$(\"#map\")");
//      console.log($("#map"));
//
//      $("#map").closePopup();
//      if (visible && !this.map.hasLayer(layer)) {
//        $("#map").addLayer(layer);
//      }
//      if (!visible && this.map.hasLayer(layer)) {
//        $("#map").removeLayer(layer);
//      }

//      console.log("S.MapView:");
//      S.MapView.closePopup();
//      if (visible && !this.map.hasLayer(layer)) {
//        S.MapView.addLayer(layer);
//      }
//      if (!visible && this.map.hasLayer(layer)) {
//        S.MapView.removeLayer(layer);
//      }


      // End legend view toggle

//      return this_;

  });
})(Shareabouts, jQuery, Shareabouts.Util.console);