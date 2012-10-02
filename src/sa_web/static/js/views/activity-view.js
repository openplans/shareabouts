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

      this.checkForNewActivity();
    },

    checkForNewActivity: function() {
      var options = {
        add: true,
        at: 0
      };

      // Only get new activity where id is greater than the newest id, if it exists
      if (this.collection.size() > 0) {
        options.data = {after: this.collection.first().get('id')};
      }

      options.complete = _.bind(function() {
        // After a check for activity has completed, no matter the result,
        // schedule another.
        _.delay(_.bind(this.checkForNewActivity, this), this.interval);
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
        this.collection.fetch({
          data: {before: this.collection.last().get('id'), limit: 10},
          add: true,
          success: function() { _.delay(notFetching, notFetchingDelay); },
          error: function() {_.delay(notFetching, notFetchingDelay); }
        });
      }
    },

    onAddAction: function(model, collection, options) {
      this.renderAction(model, options.index);
    },

    onResetActivity: function(collection) {
      this.render();
    },

    renderAction: function(model, index) {
      var self = this,
          actionType = model.get('type'),
          isPlaceAction = (actionType === 'places'),
          surveyConfig = this.options.surveyConfig,
          supportConfig = this.options.supportConfig,
          placeData,
          modelData,
          actionText,
          anonSubmitterName,
          $template,
          placeType,
          placeModel = this.options.places.get(model.get('place_id'));

      // Handle when placeModel is undefined (ie a new place added elsewhere)
      if (!placeModel) {
        // Update the place collection and then render this action
        this.options.places.fetch({
          success: function() {
            self.renderAction(model, index);
          }
        });
        return;
      }

      placeType = this.options.placeTypes[placeModel.get('location_type')];

      // Handle if an existing place type does not match the list of available
      // place types.
      if (placeType) {
        // Get the place that the action is about.
        if (isPlaceAction) {
          placeData = model.get('data');
          actionText = this.options.placeConfig.action_text;
          anonSubmitterName = this.options.placeConfig.anonymous_name;
        } else {
          placeData = this.options.places.get(model.get('place_id')).toJSON();

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
        if ('AEIOUaeiou'.indexOf(placeData['location_type'][0]) > -1) {
          placeData['type_starts_with_vowel'] = true;
        }

        modelData = _.extend({
          place: placeData,
          is_place: isPlaceAction
        }, model.toJSON());

        modelData.action = actionText;
        modelData.data.submitter_name = model.get('data').submitter_name || anonSubmitterName;

        $template = ich['activity-list-item'](modelData);

        if (index >= this.$el.children().length) {
          this.$el.append($template);
        } else {
          $template
            // Hide first so that slideDown does something
            .hide()
            // Insert before the index-th element
            .insertBefore(this.$el.find('.activity-item:nth-child('+index+1+')'))
            // Nice transition into view ()
            .slideDown();

          // Just adds it with no transition
          // this.$el.find('.activity-item:nth-child('+index+1+')').before($template);
        }
      }
    },

    render: function(){
      var self = this;

      self.$el.empty();
      self.collection.each(function(model) {
        self.renderAction(model, self.collection.length);
      });
      return self;
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
