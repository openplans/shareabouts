var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceDetailView = Backbone.View.extend({
    initialize: function() {
      this.model.on('change', this.onChange, this);

      this.surveyView = new S.SurveyView({
        collection: this.model.responseCollection,
        surveyConfig: this.options.surveyConfig
      });

      this.supportView = new S.SupportView({
        collection: this.model.supportCollection,
        supportConfig: this.options.supportConfig,
        userToken: this.options.userToken
      });
    },

    render: function() {
      // TODO: figure out the best way to augment template data
      var self = this,
          items = S.TemplateHelpers.getItemsFromModel(self.options.placeConfig.items,
            this.model, ['submitter_name', 'name', 'location_type']),
            location_type = this.model.get('location_type'),
            placeType = this.options.placeTypes[location_type],
          
          // TODO : a better default than 'point'?
          label = placeType ? (placeType.label || location_type) : 'point',
          data = _.extend({
            place_type_label: label,
            permalink: window.location.toString(),
            pretty_created_datetime: function() {
              return S.Util.getPrettyDateTime(this.created_datetime,
                self.options.placeConfig.pretty_datetime_format);
            },
            items: items,
            survey_config: this.options.surveyConfig
          }, this.model.toJSON()),
          icon;

      data.submitter_name = this.model.get('submitter_name') ||
        this.options.placeConfig.anonymous_name;

      icon = this.options.placeTypes[data.location_type].focused;
      data.icon = {
        url: icon.options.iconUrl,
        width: icon.options.iconSize.x,
        height: icon.options.iconSize.x,
        anchorX: icon.options.iconAnchor.x,
        anchorY: icon.options.iconAnchor.y
      };

      // Augment the template data with the attachments list
      data.attachments = this.model.attachmentCollection.toJSON();

      this.$el.html(ich['place-detail'](data));

      // Render the view as-is (collection may have content already)
      this.$('.survey').html(this.surveyView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.responseCollection.fetch();

      this.$('.support').html(this.supportView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.supportCollection.fetch();

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    }
  });
})(Shareabouts, jQuery, Shareabouts.Util.console);
