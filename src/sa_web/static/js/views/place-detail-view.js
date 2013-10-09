/*globals Backbone _ jQuery Handlebars */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceDetailView = Backbone.View.extend({
    initialize: function() {
      this.surveyType = this.options.surveyConfig.submission_type;
      this.supportType = this.options.supportConfig.submission_type;

      this.model.on('change', this.onChange, this);

      // Make sure the submission collections are set
      this.model.submissionSets[this.surveyType] = this.model.submissionSets[this.surveyType] ||
        new S.SubmissionCollection(null, {
          submissionType: this.surveyType,
          placeModel: this.model
        });

      this.model.submissionSets[this.supportType] = this.model.submissionSets[this.supportType] ||
        new S.SubmissionCollection(null, {
          submissionType: this.supportType,
          placeModel: this.model
        });


      this.surveyView = new S.SurveyView({
        collection: this.model.submissionSets[this.surveyType],
        surveyConfig: this.options.surveyConfig
      });

      this.supportView = new S.SupportView({
        collection: this.model.submissionSets[this.supportType],
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

          data = _.extend({
            place_type_label: placeType ? (placeType.label || location_type) : null,
            permalink: window.location.toString(),
            pretty_created_datetime: function() {
              return S.Util.getPrettyDateTime(this.created_datetime,
                self.options.placeConfig.pretty_datetime_format);
            },
            items: items,
            survey_config: this.options.surveyConfig
          }, this.model.toJSON());

      data.submitter_name = this.model.get('submitter_name') ||
        this.options.placeConfig.anonymous_name;

      // Augment the template data with the attachments list
      data.attachments = this.model.attachmentCollection.toJSON();

      this.$el.html(Handlebars.templates['place-detail'](data));

      // Render the view as-is (collection may have content already)
      this.$('.survey').html(this.surveyView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.submissionSets[this.surveyType].fetch();

      this.$('.support').html(this.supportView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.submissionSets[this.supportType].fetch();

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    }
  });
}(Shareabouts, jQuery, Shareabouts.Util.console));
