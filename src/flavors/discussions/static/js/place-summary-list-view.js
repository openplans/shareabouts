var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceSumamryListView = Backbone.View.extend({
    initialize: function() {
    },

    render: function() {
      var content = ich['place-summary-list']({
        discussions: _.map(this.collection.toJSON(), _.bind(this.extendedPlaceData, this)),
        survey_config: this.options.surveyConfig
      });
      this.$el.html(content);

      return this;
    },

    extendedPlaceData: function(data) {
      var self = this;

      data.pretty_created_datetime = function() {
        return S.Util.getPrettyDateTime(data.created_datetime,
          self.options.placeConfig.pretty_datetime_format);
      };

      data.link_path = '/place/' + data.id;

      responseData = _.find(data.submissions, function(sset) {
        return sset.type === self.options.surveyConfig.submission_type;
      });
      data.responses = responseData || {length: 0};
      // The template will need to know whether to use singular or plural
      data.has_single_response = (data.responses.length === 1);

      return data;
    }
  });
})(Shareabouts, jQuery, Shareabouts.Util.console);
