var Shareabouts = Shareabouts || {};

(function(S, $){
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
      var userToken = this.options.userToken,
          userSupport = this.collection.find(function(model) {
            return model.get('user_token') == userToken; });

      this.userSupport = userSupport;
      return userSupport;
    },

    onChange: function() {
      this.updateSupportStatus();
      this.render();
    },

    onSupportChange: function(evt) {
      var checked = evt.target.checked,
          $form,
          attrs;

      evt.target.disabled = true;

      if (checked) {
        $form = this.$('form'),
        attrs = S.Util.getAttrs($form);
        this.collection.create(attrs, {wait: true});
      } else {
        this.userSupport.destroy();
      }

      console.log('checked?', checked);
    }

  });

})(Shareabouts, jQuery);
