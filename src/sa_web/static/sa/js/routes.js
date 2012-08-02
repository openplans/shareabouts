var Shareabouts = Shareabouts || {};

(function(S, $){
  S.App = Backbone.Router.extend({
    routes: {
      'place/new': 'newPlace',
      'place/:id': 'viewPlace',
      'place/:id/edit': 'editPlace'
    },

    initialize: function(options) {
      this.collection = new S.PlaceCollection([], {
        submissionType: options.surveyConfig['submission_type']
      });
      this.activities = new S.ActivityCollection();
      this.appView = new S.AppView({
        el: 'body',
        collection: this.collection,
        activities: this.activities,
        placeTypes: options.placeTypes,
        surveyConfig: options.surveyConfig,
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

})(Shareabouts, jQuery);
