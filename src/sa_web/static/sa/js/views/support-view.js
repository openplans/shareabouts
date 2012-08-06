var Shareabouts = Shareabouts || {};

(function(S, $){
  S.SupportView = Backbone.View.extend({
    events: {
      'change #support': 'onSupportChange'
    },
    initialize: function() {
      this.collection.on('reset', this.onChange, this);
      this.collection.on('add', this.onChange, this);
    },

    render: function() {
      this.$el.html(ich['place-detail-support']({
        count: this.collection.size() || '',
        support_config: this.options.supportConfig
      }));

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    },

    onSupportChange: function(evt) {
      var checked = evt.target.checked;
      console.log('checked?', checked);
    }

  });

})(Shareabouts, jQuery);
