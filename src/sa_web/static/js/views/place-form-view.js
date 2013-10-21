/*globals _ Spinner Handlebars Backbone jQuery */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceFormView = Backbone.View.extend({
    // View responsible for the form for adding and editing places.
    events: {
      'submit form': 'onSubmit',
      'change input[type="file"]': 'onInputFileChange'
    },
    initialize: function(){
      S.TemplateHelpers.overridePlaceTypeConfig(this.options.placeConfig.items,
        this.options.defaultPlaceTypeName);
      S.TemplateHelpers.insertInputTypeFlags(this.options.placeConfig.items);

      // Bind model events
      this.model.on('error', this.onError, this);
    },
    render: function(){
      // Augment the model data with place types for the drop down
      var data = _.extend({
        place_config: this.options.placeConfig,
        current_user: S.currentUser
      }, this.model.toJSON());

      this.$el.html(Handlebars.templates['place-form'](data));
      return this;
    },
    remove: function() {
      this.unbind();
    },
    onError: function(model, res) {
      // TODO handle model errors!
      console.log('oh no errors!!', model, res);
    },
    // Get the attributes from the form
    getAttrs: function() {
      var attrs = {},
          center = this.options.appView.getCenter();

      // Get values from the form
      _.each(this.$('form').serializeArray(), function(item, i) {
        attrs[item.name] = item.value;
      });

      // Get the location attributes from the map
      attrs.geometry = {
        type: 'Point',
        coordinates: [center.lng, center.lat]
      };

      return attrs;
    },
    onInputFileChange: function(evt) {
      var self = this,
          file,
          attachment;

      if(evt.target.files && evt.target.files.length) {
        file = evt.target.files[0];

        this.$('.fileinput-name').text(file.name);
        S.Util.fileToCanvas(file, function(canvas) {
          canvas.toBlob(function(blob) {
            var fieldName = $(evt.target).attr('name'),
                data = {
                  name: fieldName,
                  blob: blob,
                  url: canvas.toDataURL('image/jpeg')
                };

            attachment = self.model.attachmentCollection.find(function(model) {
              return model.get('name') === fieldName;
            });

            if (_.isUndefined(attachment)) {
              self.model.attachmentCollection.add(data);
            } else {
              attachment.set(data);
            }
          }, 'image/jpeg');
        }, {
          // TODO: make configurable
          maxWidth: 800,
          maxHeight: 800,
          canvas: true
        });
      }
    },
    onSubmit: function(evt) {
      var router = this.options.router,
          model = this.model,
          // Should not include any files
          attrs = this.getAttrs(),
          $button = this.$('name="save-place-btn"'),
          spinner, $fileInputs;

      evt.preventDefault();

      $button.attr('disabled', 'disabled');
      spinner = new Spinner(S.smallSpinnerOptions).spin(this.$('.form-spinner')[0]);

      // Save and redirect
      this.model.save(attrs, {
        success: function() {
          router.navigate('/place/' + model.id, {trigger: true});
        },
        complete: function() {
          $button.removeAttr('disabled');
          spinner.stop();
        },
        wait: true
      });
    }
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
