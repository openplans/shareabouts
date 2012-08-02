var Shareabouts = Shareabouts || {};

(function(S, $){
  S.PlaceDetailView = Backbone.View.extend({
    events: {
      'submit form': 'onSubmit'
    },
    initialize: function() {
      this.model.on('change', this.onChange, this);
      this.model.submissionCollection.on('reset', this.onSubmissionsChange, this);
      this.model.submissionCollection.on('add', this.onSubmissionsChange, this);
    },

    render: function() {
      // TODO: figure out the best way to augment template data
      var data = _.extend({
        pretty_created_datetime: function() {
          return S.Util.getPrettyDateTime(this.created_datetime);
        },
        survey_config: this.options.surveyConfig
      }, this.model.toJSON());

      this.$el.html(ich['place-detail'](data));
      this.renderSubmissions();

      this.model.submissionCollection.fetch();

      return this;
    },

    renderSubmissions: function() {
      var self = this,
          submissions = [];

      // Submissions should be an array of objects with submitter_name,
      // pretty_created_datetime, and items (name, label, and prompt)
      this.model.submissionCollection.each(function(model, i) {
        var items = [];
        _.each(self.options.surveyConfig.items, function(item, j){
          if (item.name !== 'submitter_name') {
            items.push({
              name: item.name,
              label: item.label,
              value: model.get(item.name)
            });
          }
        });
        submissions.push({
          submitter_name: model.get('submitter_name'),
          pretty_created_datetime: S.Util.getPrettyDateTime(model.get('created_datetime')),
          items: items
        });
      });

      this.$('.submissions-container').html(ich['place-detail-submissions']({
        submissions: submissions,
        survey_config: this.options.surveyConfig
      }));
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    },

    onSubmissionsChange: function() {
      this.renderSubmissions();
    },

    // Get the attributes from the form
    getAttrs: function() {
      var attrs = {};

      // Get values from the form
      _.each(self.$('form').serializeArray(), function(item, i) {
        attrs[item.name] = item.value;
      });

      return attrs;
    },

    onSubmit: function(evt) {
      evt.preventDefault();
      this.model.submissionCollection.create(this.getAttrs());

      // Clear the form
      this.$('form').get(0).reset();
    }

  });

})(Shareabouts, jQuery);
