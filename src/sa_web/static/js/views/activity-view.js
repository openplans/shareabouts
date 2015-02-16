/*globals jQuery _ Backbone Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.ActivityView = Backbone.View.extend({
    initialize: function() {
      var self = this;

      // Add class to the body to show the activity view
      $('body').addClass('activity-enabled');

      this.activityViews = [];

      this.placeCollection = this.options.places;

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

        // HACK! Each action should have its own view and bind its own events.
        // A Marionette CompositeView/ItemView would be ideal. Until then...
        var actionType = this.getAttribute('data-action-type'),
            placeId = this.getAttribute('data-place-id');

        S.Util.log('USER', 'action', 'click', actionType+' -- '+placeId);
        self.options.router.navigate(this.getAttribute('href'), {trigger: true});
      });

      // Check to see if we're at the bottom of the list and then fetch more results.
      this.$container.on('scroll', _.bind(this.debouncedOnScroll, this));

      // Bind collection events
      this.collection.on('add', this.onAddAction, this);
      this.collection.on('reset', this.onResetActivity, this);
    },

    checkForNewActivity: function() {
      var options = {
            remove: false
          },
          meta = this.collection.metadata;

      // The metadata will be reset to page 1 if a new action has been added.
      // We need to cache the current page information so that when we will
      // fetch to correct page when we scroll to the next break.
      options.complete = _.bind(function() {
        // The total length may have changed, so don't overwrite it!
        meta.length = this.collection.metadata.length;
        this.collection.metadata = meta;
        this.fetching = false;

        // After a check for activity has completed, no matter the result,
        // schedule another.
        if (this.newContentTimeout) {
          clearTimeout(this.newContentTimeout);
        }
        this.newContentTimeout = setTimeout(_.bind(this.checkForNewActivity, this), this.interval);
      }, this);

      // Don't fetch new activity if we're in the middle of fetching a new page.
      if (!this.fetching) {
        this.fetching = true;
        this.collection.fetch(options);
      } else {
        // Let's wait 5 seconds and try again.
        this.newContentTimeout = setTimeout(_.bind(this.checkForNewActivity, this), 5000);
      }
    },

    onScroll: function(evt) {
      var self = this,
          notFetchingDelay = 500,
          notFetching = function() { self.fetching = false; },
          shouldFetch = (this.$el.height() - this.$container.height() <=
                        this.$container.scrollTop() + this.infiniteScrollBuffer);

      if (shouldFetch && !self.fetching) {
        self.fetching = true;
        this.collection.fetchNextPage(
          function() { _.delay(notFetching, notFetchingDelay); },
          function() { _.delay(notFetching, notFetchingDelay); }
        );
      }
    },

    onAddAction: function(model, collection) {
      this.renderAction(model, collection.indexOf(model));
    },

    onResetActivity: function(collection) {
      var self = this,
          placeIdsToFetch = [];

      // We have acttions to show. Let's make sure we have the places we need
      // to render them. If not, we'll fetch them in bulk and render after.
      collection.each(function(actionModel) {
        var actionType = actionModel.get('target_type'),
            targetData = actionModel.get('target');

        if (!self.placeCollection.get(targetData.id)) {
          if (actionType === 'place') {
            placeIdsToFetch.push(targetData.id);
          }
          else {
            placeIdsToFetch.push(_.last(targetData.place.split('/')));
          }
        }
      });

      if (placeIdsToFetch.length > 0) {
        // Get the missing places and then render activity
        self.placeCollection.fetchByIds(placeIdsToFetch, {
          // Check for a valid location type before adding it to the collection
          validate: true,
          success: function() {
            self.render();
          }
        });
      } else {
        this.render();
      }
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
          placeData = placeModel.toJSON();

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

      // Check for a valid location type before adding it to the collection
      options.validate = true;

      if (placeUrl) {
        placeId = _.last(placeUrl.split('/'));
      } else {
        placeId = actionModel.get('target').id;
      }

      // If a place with the given ID exists, call sucess immediately.
      placeModel = this.placeCollection.get(placeId);
      if (placeModel && options.success) {
        options.success(placeModel, null, options);

      // Otherwise, fetch the place and pass the callbacks along.
      } else if (!placeModel) {
        this.placeCollection.fetchById(placeId, options);
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
