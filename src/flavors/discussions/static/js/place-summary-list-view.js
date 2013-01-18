var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceSumamryListView = Backbone.View.extend({
    initialize: function() {
    },

    render: function() {
      var content = ich['place-summary-list']({discussions: this.collection.toJSON()});
      this.$el.html(content);

      return this;
    },
  });
})(Shareabouts, jQuery, Shareabouts.Util.console);
