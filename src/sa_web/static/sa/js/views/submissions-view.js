var Shareabouts = Shareabouts || {};

(function(S, $){
  S.SubmissionsView = Backbone.View.extend({
    events: {
      'submit form': 'onSubmit',
      'click .reply-link': 'onReplyClick'
    },
    initialize: function() {
      this.collection.on('reset', this.onChange, this);
      this.collection.on('add', this.onChange, this);
    },

    render: function() {
      var self = this,
          submissions = [];

      // I don't understand why we need to redelegate the event here, but they
      // are definitely unbound after the first render.
      this.delegateEvents();

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
          submitter_is_anonymous: (!model.get('submitter_name')),
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
      this.unbind();
      this.$el.remove();
    },

    onChange: function() {
      this.render();
    },

    onSubmit: function(evt) {
      evt.preventDefault();
      var $form = this.$('form'),
          attrs = S.Util.getAttrs($form);

      // Create a model with the attributes from the form
      this.collection.create(attrs);

      // Clear the form
      $form.get(0).reset();
    },

    onReplyClick: function(evt) {
      evt.preventDefault();
      this.$('textarea, input').not('[type="hidden"]').first().focus();
    }

  });

})(Shareabouts, jQuery);
