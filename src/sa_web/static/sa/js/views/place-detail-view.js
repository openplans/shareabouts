var Shareabouts = Shareabouts || {};

(function(S, $){
  S.PlaceDetailView = Backbone.View.extend({
    initialize: function() {
      this.model.on('change', this.onChange, this);
    },

    render: function() {
      // TODO: figure out the best way to augment template data
      var data = _.extend({
        pretty_created_datetime: function() {
          return S.Util.getPrettyDateTime(this.created_datetime);
        }
      }, this.model.toJSON());

      this.$el.html(ich['place-detail'](data));
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