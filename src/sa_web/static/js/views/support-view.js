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

      this.$el.html(Handlebars.templates['place-detail-support']({
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

    getSupportStatus: function(userToken) {
      return this.collection.find(function(model) {
        return model.get('user_token') === userToken;
      });
    },

    updateSupportStatus: function() {
      this.userSupport = this.getSupportStatus(this.options.userToken);
    },

    onChange: function() {
      this.updateSupportStatus();
      this.render();
    },

    onSupportChange: function(evt) {
      var self = this,
          checked = evt.target.checked,
          $form,
          attrs,
          userSupport;

      evt.target.disabled = true;

      if (checked) {
        $form = this.$('form'),
        attrs = S.Util.getAttrs($form);
        this.collection.create(attrs, {
          wait: true,
          error: function() {
            self.getSupportStatus(self.options.userToken).destroy();
            alert('Oh dear. It looks like that didn\'t save.');
          }
        });
      } else {
        userSupport = this.userSupport;
        this.userSupport.destroy({
          wait: true,
          error: function() {
            self.collection.add(userSupport);
            alert('Oh dear. It looks like that didn\'t save.');
          }
        });
      }
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
