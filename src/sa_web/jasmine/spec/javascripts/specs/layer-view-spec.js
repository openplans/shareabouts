describe('layer-view.js', function() {

  describe('LayerView', function() {
    var router = new Backbone.Router(),
        // For use in the LayerView constructor
        mapView = new Shareabouts.MapView({
          mapConfig: Shareabouts.SpecConfig.mapConfig,
          collection: new Backbone.Collection(),
          router: router,
          placeTypes: Shareabouts.SpecConfig.placeTypes
        });

      function getLayerView(o) {
        var options = _.extend({
          model: new Backbone.Model({
            location_type: 'landmark'
          }),
          router: router,
          map: mapView.map,
          placeLayers: mapView.placeLayers,
          placeTypes: Shareabouts.SpecData.AppConfig.placeTypes
        }, o);

        return new Shareabouts.LayerView(options);
      }


    it('should exist', function() {
      expect(Shareabouts.LayerView).toBeDefined();
    });

    it('should not have a location if the place model is new', function(){
      var layerView = getLayerView();

      expect(layerView.latLng).toBeUndefined();
      expect(layerView.layer).toBeUndefined();
    });

    it('should have a location it it exists on the place model', function(){
      var layerView = getLayerView({
        model: new Backbone.Model(Shareabouts.SpecData.placeCollectionData[0])
      });

      expect(layerView.latLng).toBeDefined();
      expect(layerView.latLng.lat).toBe(39.9579119326);
      expect(layerView.layer).toBeDefined();
    });

    describe('Place model has an unknown location_type', function() {
      var layerView;

      beforeEach(function(){
        spyOn(Shareabouts.Util.console, 'warn');

        layerView = getLayerView({
          model: new Backbone.Model({
            location_type: 'NotForRealz',
            location:{"lat":39.9579119326,"lng":-75.1707229614}
          })
        });
      });

      it('should not have a location', function(){
        expect(layerView.latLng).toBeUndefined();
        expect(layerView.layer).toBeUndefined();
      });

      it('should log a warning', function(){
        expect(Shareabouts.Util.console.warn).toHaveBeenCalled();
      });
    });

    it('should hide on render if the lat/lng is not within the map bounds', function(){
      var layerView = getLayerView({
        model: new Backbone.Model({
          id: 1,
          location_type: 'landmark',
          geometry: {type: 'Point', coordinates: [-75.16356468200684, 39.95238529624027]}
        })
      });
      spyOn(layerView, 'show');

      layerView.render();
      expect(layerView.show).toHaveBeenCalled();
    });


    it('should show on render if the lat/lng is within the map bounds', function(){
      var layerView = getLayerView({
        model: new Backbone.Model({
          id: 1,
          location_type: 'landmark',
          geometry: {type: 'Point', coordinates: [0, 0]}
        })
      });

      spyOn(layerView, 'hide');

      layerView.render();
      expect(layerView.hide).toHaveBeenCalled();

    });
  });

});
