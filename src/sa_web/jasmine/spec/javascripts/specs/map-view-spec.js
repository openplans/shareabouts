describe('map-view.js', function() {

  describe('MapView', function() {
    var mapView;

    beforeEach(function() {
      var router = new Backbone.Router(),
          collection = new Backbone.Collection(Shareabouts.SpecData.placeCollectionData);

      mapView = new Shareabouts.MapView({
        mapConfig: Shareabouts.SpecConfig.mapConfig,
        collection: collection,
        router: router,
        placeTypes: Shareabouts.SpecConfig.placeTypes
      });
    });

    it('should exist', function() {
      expect(Shareabouts.MapView).toBeDefined();
    });

    it('should have 3 layers', function(){
      expect(_(mapView.map._layers).size()).toBe(3);
    });

    it('should have no layerViews until render is called', function() {
      expect(_(mapView.layerViews).size()).toBe(0);
    });

    it('should have layerViews after render is called', function() {
      mapView.render();
      expect(_(mapView.layerViews).size()).toBe(10);
    });

  });

});
