var Shareabouts = Shareabouts || {};

(function(S, $){
  S.PlaceDetailView = Backbone.View.extend({
    initialize: function() {
      this.model.on('change', this.onChange, this);

      this.submissionsView = new S.SubmissionsView({
        collection: this.model.submissionCollection,
        surveyConfig: this.options.surveyConfig
      });
    },

    render: function() {
      // TODO: figure out the best way to augment template data
      var self = this,
          data = _.extend({
            pretty_created_datetime: function() {
              return S.Util.getPrettyDateTime(this.created_datetime);
            },
            survey_config: this.options.surveyConfig
          }, this.model.toJSON());

      this.$el.html(ich['place-detail'](data));

      // Render the view as-is (collection may have content already)
      this.$('.survey').html(this.submissionsView.render().el);
      // Fetch for submissions and automatically update the element
      this.model.submissionCollection.fetch();

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    }
  });

})(Shareabouts, jQuery);
