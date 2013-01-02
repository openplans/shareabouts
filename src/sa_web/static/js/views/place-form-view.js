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
      this.model.on('change', this.onChange, this);
    },
    render: function(){
      // Augment the model data with place types for the drop down
      var data = _.extend({
        place_config: this.options.placeConfig
      }, this.model.toJSON());

      this.$el.html(ich['place-form'](data));
      return this;
    },
    remove: function() {
      this.unbind();
    },
    onChange: function() {
      this.render();
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
      _.each(self.$('form').serializeArray(), function(item, i) {
        attrs[item.name] = item.value;
      });

      // Get the location attributes from the map
      attrs.location = {
        lat: center.lat,
        lng: center.lng
      };

      return attrs;
    },
    onInputFileChange: function(evt) {
      if(evt.target.files && evt.target.files.length) {
        this.$('.fileinput-name').text(evt.target.files[0].name);
      }
    },
    onSubmit: function(evt) {
      var router = this.options.router,
          model = this.model,
          // Should not include any files
          attrs = this.getAttrs(),
          $fileInputs;

      evt.preventDefault();

      attrs.attachments = {};
      // Gets all of the file inputs
      $fileInputs = this.$('form').find('input[type="file"]');

      // Get all of the files for each file input
      $fileInputs.each(function(i, fileInput) {
        var files = fileInput.files;

        // Are there files?
        if (files.length > 0) {
          // Add each file to the attachment
          _.each(files, function(file, n) {
            attrs.attachments[$(fileInput).attr('name') + n] = file;
          });
        }
      });

      // Save and redirect
      this.model.save(attrs, {
        success: function() {
          router.navigate('/place/' + model.id, {trigger: true});
        },
        wait: true
      });
    }
  });

})(Shareabouts, jQuery, Shareabouts.Util.console);
