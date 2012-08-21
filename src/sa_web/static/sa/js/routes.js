var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.App = Backbone.Router.extend({
    routes: {
      'place/new': 'newPlace',
      'place/:id': 'viewPlace',
      'place/:id/edit': 'editPlace'
    },

    initialize: function(options) {
      this.collection = new S.PlaceCollection([], {
        responseType: options.surveyConfig['submission_type'],
        supportType: options.supportConfig['submission_type']
      });
      this.activities = new S.ActivityCollection();
      this.appView = new S.AppView({
        el: 'body',
        collection: this.collection,
        activities: this.activities,
        placeTypes: options.placeTypes,
        surveyConfig: options.surveyConfig,
        supportConfig: options.supportConfig,
        userToken: options.userToken,
        router: this
      });

      // Call reset after the views are created, since they're all going to
      // be listening to reset.
      this.collection.reset(options.places);
      this.activities.reset(options.activity);
    },

    newPlace: function() {
      this.appView.newPlace();
    },

    viewPlace: function(id) {
      var model = this.collection.get(id);
      this.appView.viewPlace(model);
    },

    editPlace: function(){}
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
