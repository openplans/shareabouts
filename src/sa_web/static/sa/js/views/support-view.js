var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.SupportView = Backbone.View.extend({
    events: {
      'change #support': 'onSupportChange'
    },

    initialize: function() {
      this.collection.on('reset', this.onChange, this);
      this.collection.on('add', this.onChange, this);
      this.collection.on('remove', this.onChange, this);

      this.updateSupportStatus();
    },

    render: function() {
      // I don't understand why we need to redelegate the event here, but they
      // are definitely unbound after the first render.
      this.delegateEvents();

      this.$el.html(ich['place-detail-support']({
        count: this.collection.size() || '',
        user_token: this.options.userToken,
        is_supporting: (this.userSupport !== undefined),
        support_config: this.options.supportConfig
      }));

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    updateSupportStatus: function() {
      var userToken = this.options.userToken;

      this.userSupport = this.collection.find(function(model) {
        return model.get('user_token') === userToken;
      });
    },

    onChange: function() {
      this.updateSupportStatus();
      this.render();
    },

    handleError: function() {
      // None of the model events will be triggered, update the
      // checked status of the checkbox
      this.render();
      alert('Oh dear. It looks like that didn\'t save.');
    },

    onSupportChange: function(evt) {
      var checked = evt.target.checked,
          $form,
          attrs;

      evt.target.disabled = true;

      if (checked) {
        $form = this.$('form'),
        attrs = S.Util.getAttrs($form);
        this.collection.create(attrs, {wait: true, error: _.bind(this.handleError, this)});
      } else {
        this.userSupport.destroy({wait: true, error: _.bind(this.handleError, this)});
      }
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
