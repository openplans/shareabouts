/*globals jQuery _ Backbone Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.ActivityView = Backbone.View.extend({
    initialize: function() {
      var self = this;

      // Add class to the body to show the activity view
      $('body').addClass('activity-enabled');

      this.activityViews = [];

      // Infinite scroll elements and functions
      // Window where the activity lives
      this.$container = this.$el.parent();
      // How often to check for new content
      this.interval = this.options.interval;
      // How many pixel from the bottom until we look for more/older actions
      this.infiniteScrollBuffer = this.options.infiniteScrollBuffer || 25;
      // Debounce the scroll handler for efficiency
      this.debouncedOnScroll = _.debounce(this.onScroll, 600);

      // Bind click event to an action so that you can see it in a map
      this.$el.delegate('a', 'click', function(evt){
        evt.preventDefault();
        self.options.router.navigate(this.getAttribute('href'), {trigger: true});
      });

      // Check to see if we're at the bottom of the list and then fetch more results.
      this.$container.on('scroll', _.bind(this.debouncedOnScroll, this));

      // Bind collection events
      this.collection.on('add', this.onAddAction, this);
      this.collection.on('reset', this.onResetActivity, this);
    },

    checkForNewActivity: function() {
      var options = {};

      options.complete = _.bind(function() {
        // After a check for activity has completed, no matter the result,
        // schedule another.
        if (this.newContentTimeout) {
          clearTimeout(this.newContentTimeout);
        }
        this.newContentTimeout = setTimeout(_.bind(this.checkForNewActivity, this), this.interval);
      }, this);

      this.collection.fetch(options);
    },

    onScroll: function(evt) {
      var self = this,
          notFetchingDelay = 500,
          notFetching = function() { self.fetching = false; },
          shouldFetch = (this.$el.height() - this.$container.height() <=
                        this.$container.scrollTop() + this.infiniteScrollBuffer);

      if (shouldFetch && !self.fetching) {
        self.fetching = true;
        this.collection.fetchNextPage({
          success: function() { _.delay(notFetching, notFetchingDelay); },
          error: function() {_.delay(notFetching, notFetchingDelay); }
        });
      }
    },

    onAddAction: function(model, collection) {
      this.renderAction(model, collection.indexOf(model));
    },

    onResetActivity: function(collection) {
      this.render();
    },

    preparePlaceData: function(placeModel) {
    },

    processActionData: function(actionModel, placeModel) {
      var actionType = actionModel.get('target_type'),
          isPlaceAction = (actionType === 'place'),
          surveyConfig = this.options.surveyConfig,
          supportConfig = this.options.supportConfig,
          placeData,
          actionData,
          actionText,
          anonSubmitterName,
          placeType = this.options.placeTypes[placeModel.get('location_type')];

      // Handle if an existing place type does not match the list of available
      // place types.
      if (placeType) {
        // Get the place that the action is about.
        if (isPlaceAction) {
          placeData = actionModel.get('target');
          actionText = this.options.placeConfig.action_text;
          anonSubmitterName = this.options.placeConfig.anonymous_name;
        } else {
          placeData = placeModel.toJSON(); //this.options.places.get(actionModel.get('target').id).toJSON();

          if (actionType === surveyConfig.submission_type) {
            // Survey
            actionText = this.options.surveyConfig.action_text;
            anonSubmitterName = this.options.surveyConfig.anonymous_name;
          } else if (actionType === supportConfig.submission_type) {
            // Support
            actionText = this.options.supportConfig.action_text;
            anonSubmitterName = this.options.supportConfig.anonymous_name;
          }
        }

        // Check whether the location type starts with a vowel; useful for
        // choosing between 'a' and 'an'.  Not language-independent.
        if ('AEIOUaeiou'.indexOf(placeData.location_type[0]) > -1) {
          placeData.type_starts_with_vowel = true;
        }

        placeData.place_type_label = placeType.label || placeData.location_type;

        actionData = _.extend({
          place: placeData,
          is_place: isPlaceAction
        }, actionModel.toJSON());

        // Set action attribute here, because the action model may have it set
        // to something else.
        actionData.action = actionText;

        // Set the submitter_name here in case it is null in the model.
        actionData.target.submitter_name = actionModel.get('target').submitter_name || anonSubmitterName;

        return actionData;
      }  // if (placeType)

      // If the client is not configured for the given placeType, then return
      // no data.
      return null;
    },

    getPlaceForAction: function(actionModel, options) {
      var placeUrl = actionModel.get('target').place,
          placeId, placeModel;
      options = options || {};

      if (placeUrl) {
        placeId = _.last(placeUrl.split('/'));
      } else {
        placeId = actionModel.get('target').id;
      }

      // If a place with the given ID exists, call sucess immediately.
      placeModel = this.options.places.get(placeId);
      if (placeModel && options.success) {
        options.success(placeModel, null, options);

      // Otherwise, fetch the place and pass the callbacks along.
      } else if (!placeModel) {
        this.options.places.fetchPlace(placeId, options);
      }
    },

    renderAction: function(model, index) {
      var self = this,
          onFoundPlace;

      // Callback for when the action's corresponding place model is found
      onFoundPlace = function(placeModel) {
        var $template,
            modelData;

        modelData = self.processActionData(model, placeModel);

        if (modelData) {
          $template = $(Handlebars.templates['activity-list-item'](modelData));

          if (index >= self.$el.children().length) {
            self.$el.append($template);
          } else {
            $template
              // Hide first so that slideDown does something
              .hide()
              // Insert before the index-th element
              .insertBefore(self.$el.find('.activity-item:nth-child('+index+1+')'))
              // Nice transition into view ()
              .slideDown();

            // Just adds it with no transition
            // self.$el.find('.activity-item:nth-child('+index+1+')').before($template);
          }
        }
      };

      this.getPlaceForAction(model, {success: onFoundPlace});
    },

    render: function(){
      var self = this,
          index = 0,
          $template,
          modelData,
          collectionData = [],
          placeModel;

      $template = Handlebars.templates['activity-list']({activities: collectionData});
      self.$el.html($template);

      self.collection.each(function(model) {
        self.renderAction(model, index++);
      });

      self.checkForNewActivity();

      return self;
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
