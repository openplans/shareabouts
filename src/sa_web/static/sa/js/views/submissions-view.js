var Shareabouts = Shareabouts || {};

(function(S, $){
  S.SubmissionsView = Backbone.View.extend({
    events: {
      'submit form': 'onSubmit'
    },
    initialize: function() {
      this.collection.on('reset', this.onChange, this);
      this.collection.on('add', this.onChange, this);
    },

    render: function() {
      var self = this,
          submissions = [];

      // Submissions should be an array of objects with submitter_name,
      // pretty_created_datetime, and items (name, label, and prompt)
      this.collection.each(function(model, i) {
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

      this.$el.html(ich['place-detail-submissions']({
        submissions: submissions,
        survey_config: this.options.surveyConfig
      }));

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
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
      this.collection.create(this.getAttrs());

      // Clear the form
      this.$('form').get(0).reset();
    }

  });

})(Shareabouts, jQuery);
