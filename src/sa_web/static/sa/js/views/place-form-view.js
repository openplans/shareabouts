var Shareabouts = Shareabouts || {};

(function(S, $){
  S.PlaceFormView = Backbone.View.extend({
    // View responsible for the form for adding and editing places.
    events: {
      'submit form': 'onSubmit'
    },
    initialize: function(){
      // Bind model events
      this.model.on('error', this.onError, this);
      this.model.on('change', this.onChange, this);

      // Cache the place types
      this.placeTypes = _.keys(this.options.placeTypes);
    },
    render: function(){
      // Augment the model data with place types for the drop down
      var data = _.extend({
        placeTypes: this.placeTypes
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
    onSubmit: function(evt) {
      var router = this.options.router,
          model = this.model;

      evt.preventDefault();
      // Save and redirect
      this.model.save(this.getAttrs(), {
        success: function() {
          router.navigate('/place/' + model.id, {trigger: true});
        },
        wait: true
      });
    }
  });

})(Shareabouts, jQuery);