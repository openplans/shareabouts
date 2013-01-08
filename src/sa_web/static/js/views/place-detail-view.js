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

      this.attachmentViews = {};
    },

    addAttachmentView: function(attachment) {
      var name = attachment.get('name');
      this.attachmentViews[name] = new S.PlaceAttachmentView({
        model: attachment,
        el: this.$('.place-item-' + name)
      });
    },

    resetAttachmentViews: function() {
      var self = this;

      _.values(self.attachmentViews, function(view) {
        view.remove();
      });
      self.attachmentViews = {};

      self.model.attachmentCollection.each(function(attachment) {
        self.addAttachmentView(attachment);
      });
    },

    render: function() {
      // TODO: figure out the best way to augment template data
      var self = this,
          items = S.TemplateHelpers.getItemsFromModel(self.options.placeConfig.items,
            this.model, ['submitter_name', 'name', 'location_type']),

          data = _.extend({
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
      data.attachments = this.model.attachmentCollection.toJSON();


      this.$el.html(ich['place-detail'](data));

      // Render the view as-is (collection may have content already)
      this.$('.survey').html(this.surveyView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.responseCollection.fetch();


      this.$('.support').html(this.supportView.render().$el);
      // Fetch for submissions and automatically update the element
      this.model.supportCollection.fetch();

      this.resetAttachmentViews();

      return this;
    },

    remove: function() {
      // Nothing yet
    },

    onChange: function() {
      this.render();
    }
  });

  S.PlaceAttachmentView = Backbone.View.extend({
    initialize: function() {
      this.model.on('progress', this.onProgress, this);
      this.model.on('change', this.renderLoaded, this)
      console.log('initializing ', this.$el);
    },

    remove: function() {
      this.model.off('progress', this.onProgress, this);
      this.model.off('change', this.renderLoaded, this);
    },

    onProgress: function(evt) {
      console.log('progress handler');
      console.log('for element ', this.$el);
      this.renderLoading(evt.loaded, evt.total);
    },

    renderLoading: function(loaded, total) {
      this.$('img').attr('src', 'http://www.gonewport.com/images/common/big-spinner.gif');
    },

    renderLoaded: function() {
      this.$('img').attr('src', this.model.get('url'));
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
