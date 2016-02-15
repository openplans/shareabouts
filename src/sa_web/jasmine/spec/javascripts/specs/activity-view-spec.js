describe('activity-view.js', function() {

  describe('ActivityView', function() {
    var activityView, placeCollection, activityCollection;

    beforeEach(function() {
      var router = new Backbone.Router();

      activityCollection = new Backbone.Collection(Shareabouts.SpecData.activityCollectionData);
      placeCollection = new Shareabouts.PlaceCollection(Shareabouts.SpecData.placeCollectionData, {
        responseType: 'comments',
        supportType: 'supports'
      });

      activityView = new Shareabouts.ActivityView({
        collection: activityCollection,
        places: placeCollection,
        router: router,

        placeTypes: {},
        surveyConfig: {},
        supportConfig: {},
        placeConfig: {},

        interval: 30000
      });
    });

    it('should exist', function() {
      expect(Shareabouts.ActivityView).toBeDefined();
    });

    it('should not detach unsaved models from the place collection when rendering an action', function(){
      var placeId = 222,
          newPlaceModel = new Backbone.Model({ name: 'TestPlace', location_type: 'landmark', id: 222 }),
          newActionModel = new Backbone.Model({ place_id: placeId, target: {id: placeId} });

      spyOn($, 'ajax').and.callFake(function(options){
        var placeForAction = { id: placeId, type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [0, 0]} },
            places = [placeForAction].concat(Shareabouts.SpecData.placeCollectionData);

        options.success(places);
      });

      placeCollection.add(newPlaceModel);
      expect(newPlaceModel.collection).toBeDefined();

      activityView.renderAction(newActionModel, 0);

      expect(newPlaceModel.collection).toBeDefined();
    });
  });

});
