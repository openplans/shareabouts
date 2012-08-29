var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.App = Backbone.Router.extend({
    routes: {
      'place/new': 'newPlace',
      'place/:id': 'viewPlace',
      'place/:id/edit': 'editPlace',
      'page/:slug': 'viewPage'
    },

    initialize: function(options) {
      var startPageConfig;

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
        pagesConfig: options.pagesConfig,
        mapConfig: options.mapConfig,
        userToken: options.userToken,
        router: this
      });

      // Call reset after the views are created, since they're all going to
      // be listening to reset.
      this.collection.reset(options.places);
      this.activities.reset(options.activity);

      // Start tracking the history
      Backbone.history.start({pushState: true});

      // Load the default page only if there is no page already in the url
      if (Backbone.history.getFragment() === '') {
        startPageConfig = _.find(options.pagesConfig, function(pageConfig) {
          return pageConfig.start_page === true;
        });

        if (startPageConfig && startPageConfig.slug) {
          this.navigate('page/' + startPageConfig.slug);
        }
      }
    },

    newPlace: function() {
      this.appView.newPlace();
    },

    viewPlace: function(id) {
      var model = this.collection.get(id);
      this.appView.viewPlace(model);
    },

    editPlace: function(){},

    viewPage: function(slug) {
      this.appView.viewPage(slug);
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
