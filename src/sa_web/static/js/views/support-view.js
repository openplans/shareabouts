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
      S.Util.log('USER', 'place', 'support-btn-click', self.collection.options.placeModel.getLoggingDetails(), self.collection.size());

      if (checked) {
        $form = this.$('form');
        attrs = S.Util.getAttrs($form);
        this.collection.create(attrs, {
          wait: true,
          beforeSend: function($xhr) {
            // Do not generate activity for anonymous supports
            if (!S.bootstrapped.currentUser) {
              $xhr.setRequestHeader('X-Shareabouts-Silent', 'true');
            }
          },
          success: function() {
            S.Util.log('USER', 'place', 'successfully-support', self.collection.options.placeModel.getLoggingDetails());
          },
          error: function() {
            self.getSupportStatus(self.options.userToken).destroy();
            alert('Oh dear. It looks like that didn\'t save.');
            S.Util.log('USER', 'place', 'fail-to-support', self.collection.options.placeModel.getLoggingDetails());
          }
        });
      } else {
        userSupport = this.userSupport;
        this.userSupport.destroy({
          wait: true,
          success: function() {
            S.Util.log('USER', 'place', 'successfully-unsupport', self.collection.options.placeModel.getLoggingDetails());
          },
          error: function() {
            self.collection.add(userSupport);
            alert('Oh dear. It looks like that didn\'t save.');
            S.Util.log('USER', 'place', 'fail-to-unsupport', self.collection.options.placeModel.getLoggingDetails());
          }
        });
      }
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
