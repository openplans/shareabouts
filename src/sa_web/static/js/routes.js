/*globals Backbone jQuery _ */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.App = Backbone.Router.extend({
    routes: {
      '': 'viewMap',
      'place/new': 'newPlace',
      'place/:id': 'viewPlace',
      'place/:id/edit': 'editPlace',
      'list': 'showList',
      'page/:slug': 'viewPage'
    },

    initialize: function(options) {
      var self = this,
          startPageConfig;

      S.PlaceModel.prototype.getLoggingDetails = function() {
        return this.id;
      };

      // Reject a place that does not have a supported location type. This will
      // prevent invalid places from being added or saved to the collection.
      S.PlaceModel.prototype.validate = function(attrs, options) {
        var locationType = attrs.location_type,
            locationTypes = _.map(S.Config.placeTypes, function(config, key){ return key; });

        if (!_.contains(locationTypes, locationType)) {
          console.warn(locationType + ' is not supported.');
          return locationType + ' is not supported.';
        }
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
    },

    showList: function() {
      this.appView.showListView();
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
