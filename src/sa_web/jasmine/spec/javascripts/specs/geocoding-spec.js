describe('geocoding', function() {

  var getConfigItems = function(type) {
    return [
      { name: 'foo', prompt: 'Foo', label: 'The Foo', type: type, attrs: [] }
    ];
  };

  describe('reversegeocode trigger', function() {
    var app;
    var originalCenter;
    var locationsData;
    var config = Shareabouts.SpecData.AppConfig;

    beforeEach(function() {
      $('body').append('<div id="jasmine-map"/>');
      $('body').append('<div id="jasmine-list-container"/>');

      app = new Shareabouts.App({
        activity: [],
        mapEl: '#jasmine-map',
        listContainerEl: '#jasmine-list-container'

        defaultPlaceTypeName: config.defaultPlaceTypeName,
        userToken: config.userToken,

        config: config.flavor,
        placeConfig: config.place,
        placeTypes: config.placeTypes,
        surveyConfig: config.survey,
        supportConfig: config.support,
        mapConfig: config.map,
        activityConfig: config.activity,
        pagesConfig: config.pages
      });

      originalCenter = app.appView.placeFormView.center;
      locationsData = [
        {
          "street": "North 13th Street",
          "adminArea6": "", "adminArea6Type": "Neighborhood", "adminArea5": "Philadelphia", "adminArea5Type": "City", "adminArea4": "Philadelphia County", "adminArea4Type": "County", "adminArea3": "PA", "adminArea3Type": "State", "adminArea1": "US", "adminArea1Type": "Country", "postalCode": "19133",
          "geocodeQualityCode": "B1AAA", "geocodeQuality": "STREET",
          "dragPoint": false,
          "sideOfStreet": "N",
          "linkId": "0",
          "unknownInput": "",
          "type": "s",
          "latLng": {"lat": 39.959312, "lng": -75.159884},
          "displayLatLng": {"lat": 39.959312, "lng": -75.159884},
          "mapUrl": "https://open.mapquestapi.com/staticmap/v4/getmap?key=Fmjtd|luur2g0bnl,25=o5…9312,-75.1598841,0,0,|&center=39.959312,-75.1598841&zoom=15&rand=643219291"
        }
      ];
      $(Shareabouts).trigger('reversegeocode', [locationsData]);
    });

    afterEach(function() {
      $('#jasmine-map').remove();
      $('#jasmine-list-container').remote();
    });

    // The behavior of this event is currently in
    // app-view.js, around line 182.

    it('should set the address string in the address bar', function() {
      // TODO
    });

    it('should set the location data on a new place', function() {
      // TODO
    });

    it('should not set a new center on the map', function() {
      // TODO
    });

    it('should not change the coordinates of a new place', function() {
      // TODO
    });

  });

});
