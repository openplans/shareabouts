var Shareabouts = Shareabouts || {};

(function(S, $){
  S.ActivityListView = Backbone.View.extend({
    initialize: function() {
      var self = this;

      this.activityViews = [];
      this.$container = this.$el.parent();
      this.interval = this.options.interval || 5000;
      this.infiniteScrollBuffer = this.options.infiniteScrollBuffer || 25;
      this.debouncedOnScroll = _.debounce(this.onScroll, 600);

      this.$el.delegate('a', 'click', function(evt){
        evt.preventDefault();
        self.options.router.navigate(this.getAttribute('href'), {trigger: true});
      });

      this.$container.on('scroll', _.bind(this.debouncedOnScroll, this));

      this.collection.on('add', this.onAddAction, this);
      this.collection.on('reset', this.onResetActivity, this);

      this.checkForNewActivity();
    },

    checkForNewActivity: function() {
      // Only get new activity where id is greater than the newest id
      if (this.collection.size() > 0) {
        this.collection.fetch({
          data: {after: this.collection.first().get('id')},
          add: true,
          at: 0
        });
      }

      _.delay(_.bind(this.checkForNewActivity, this), this.interval);
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
      this.renderActivity(model, options.index);

      // TODO Only do the following if the activity instance is a place.
      this.options.places.add(model.get('data'));
    },

    onResetActivity: function(collection) {
      this.render();
    },

    renderActivity: function(model, index) {
      var $template = ich['activity-list-item'](model.toJSON());
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
    },

    render: function(){
      var self = this;

      self.$el.empty();
      self.collection.each(function(model) {
        self.renderActivity(model, self.collection.length);
      });
      return self;
    }
  });

})(Shareabouts, jQuery);