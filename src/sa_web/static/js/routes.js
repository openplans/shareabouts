/*globals Backbone jQuery _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.App = Backbone.Router.extend({
    routes: {
      '': 'viewMap',
      'place/new': 'newPlace',
      'place/:id': 'viewPlace',
      'place/:id/edit': 'editPlace',
      'page/:slug': 'viewPage'
    },

    initialize: function(options) {
      var self = this,
          startPageConfig,
          placeParams = {};

      S.PlaceModel.prototype.getLoggingDetails = function() {
        return this.id;
      };
      
      // Global route changes
      this.bind('route', function(route, router) {
        S.Util.log('ROUTE', self.getCurrentPath());
      });

      this.loading = true;
      this.collection = new S.PlaceCollection([]);
      this.activities = new S.ActionCollection(options.activity);
      this.appView = new S.AppView({
        el: 'body',
        collection: this.collection,
        activities: this.activities,

        config: options.config,

        defaultPlaceTypeName: options.defaultPlaceTypeName,
        placeTypes: options.placeTypes,
        surveyConfig: options.surveyConfig,
        supportConfig: options.supportConfig,
        pagesConfig: options.pagesConfig,
        mapConfig: options.mapConfig,
        placeConfig: options.placeConfig,
        activityConfig: options.activityConfig,
        userToken: options.userToken,
        router: this
      });

      // Use the page size as dictated by the server by default, unless
      // directed to do otherwise in the configuration.
      if (options.config.app.places_page_size) {
        placeParams.page_size = options.config.app.places_page_size;
      }

      // Fetch all places by page
      this.collection.fetch({
        remove: false,
        data: placeParams,
        success: function(collection, data) {
          var pageSize = data.features.length,
              totalPages = Math.ceil(data.metadata.length / pageSize),
              $progressContainer = $('#map-progress'),
              $currentProgress = $('#map-progress .current-progress'),
              pagesComplete = 1,
              onPageFetch = function() {
                var percent;

                pagesComplete++;
                percent = (pagesComplete/totalPages*100);
                $currentProgress.width(percent + '%');

                if (pagesComplete === totalPages) {
                  _.delay(function() {
                    $progressContainer.hide();
                  }, 2000);
                }
              },
              i;

          if (data.metadata.next) {
            $progressContainer.show();

            $currentProgress.width((pagesComplete/totalPages*100) + '%');
            for (i=2; i <= totalPages; i++) {

              self.collection.fetch({
                remove: false,
                data: _.extend(placeParams, { page: i }),
                complete: onPageFetch
              });
            }
          }
        }
      });

      this.activities.fetch({reset: true});

      // Start tracking the history
      var historyOptions = {pushState: true};
      if (options.defaultPlaceTypeName) {
        historyOptions.root = '/' + options.defaultPlaceTypeName + '/';
      }

      Backbone.history.start(historyOptions);

      // Load the default page only if there is no page already in the url
      if (Backbone.history.getFragment() === '') {
        startPageConfig = _.find(options.pagesConfig, function(pageConfig) {
          return pageConfig.start_page === true;
        });

        if (startPageConfig && startPageConfig.slug) {
          this.navigate('page/' + startPageConfig.slug, {trigger: true});
        }
      }

      this.loading = false;
    },

    getCurrentPath: function() {
      var root = Backbone.history.root,
          fragment = Backbone.history.fragment;
      return root + fragment;
    },

    viewMap: function() {
      this.appView.viewMap();
    },

    newPlace: function() {
      this.appView.newPlace();
    },

    viewPlace: function(id) {
      this.appView.viewPlace(id, this.loading);
    },

    editPlace: function(){},

    viewPage: function(slug) {
      this.appView.viewPage(slug);
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
