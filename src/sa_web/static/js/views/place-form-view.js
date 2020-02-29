/*globals _ Spinner Handlebars Backbone jQuery Gatekeeper */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.PlaceFormView = Backbone.View.extend({
    // View responsible for the form for adding and editing places.
    events: {
      'submit form': 'onSubmit',
      'change input[type="file"]': 'onInputFileChange',
      'change [data-group-required]': 'onRequiredOptionButtonChange'
    },
    initialize: function(){
      var textareaEvent = 'oninput' in document ? 'input' : 'keyup blur';

      S.TemplateHelpers.overridePlaceTypeConfig(this.options.placeConfig.items,
        this.options.defaultPlaceTypeName);
      S.TemplateHelpers.insertInputTypeFlags(this.options.placeConfig.items);

      // Bind model events
      this.model.on('error', this.onError, this);

      // Listen to input changes on textareas. If they have a maxlength, then
      // update the character count. If maxlength is not supported, then
      // polyfill.
      this.$el.on(textareaEvent, 'textarea', function(evt) {
        var $counter = $(this).siblings('.remaining-characters').children('.character-counter'),
            maxLen, curLen, remaining;

        if (this.hasAttribute('maxlength')) {
          maxLen = this.getAttribute('maxlength');
          curLen = this.value.length;
          remaining = maxLen - curLen;

          if (remaining <= 20) {
            $counter.parent('.remaining-characters').addClass('warning');

            if (remaining <= 0) {
              remaining = 0;
              this.value = this.value.substr(0, maxLen);
            }
          } else {
            $counter.parent('.remaining-characters').removeClass('warning');
          }

          $counter.text(remaining);
          return false;
        }
      });
    },
    render: function(){
      // Augment the model data with place types for the drop down
      var data = _.extend({
        place_config: this.options.placeConfig,
        user_token: this.options.userToken,
        current_user: S.currentUser
      }, S.stickyFieldValues, this.model.toJSON());

      this.$el.html(Handlebars.templates['place-form'](data));
      this.updatedRequiredOptionButtons();

      // Init counter text
      this.$('textarea').each(function() {
        var $counter = $(this).siblings('.remaining-characters').children('.character-counter');

        if (this.hasAttribute('maxlength')) {
          $counter.text(this.getAttribute('maxlength'));
        }
      });

      return this;
    },
    remove: function() {
      this.unbind();
    },
    onError: function(model, res) {
      // TODO handle model errors!
      console.log('oh no errors!!', model, res);
    },
    // This is called from the app view
    setLatLng: function(latLng) {
      this.center = latLng;
      this.$('.drag-marker-instructions, .drag-marker-warning').addClass('is-visuallyhidden');
    },
    setLocation: function(location) {
      // We want to make sure we don't give the user the impression that their
      // location is set when it isn't yet, so only update location-receivers
      // if the center has been set.
      if (this.center) {
        this.location = location;
        this.$('.location-receiver').html(location)
      }
    },
    // Get the attributes from the form
    getAttrs: function() {
      var attrs = {},
          locationAttr = this.options.placeConfig.location_item_name,
          $form = this.$('form');

      // Get values from the form
      attrs = S.Util.getAttrs($form);

      // Get the location attributes from the map
      attrs.geometry = {
        type: 'Point',
        coordinates: [this.center.lng, this.center.lat]
      };

      if (this.location && locationAttr) {
        attrs[locationAttr] = this.location;
      }

      return attrs;
    },
    onInputFileChange: function(evt) {
      var self = this,
          file,
          attachment,
          maxHeight,
          maxWidth;

      if(evt.target.files && evt.target.files.length) {
        file = evt.target.files[0];
        maxHeight = parseInt(evt.target.getAttribute("data-max-height"));
        maxWidth = parseInt(evt.target.getAttribute("data-max-width"));

        this.$('.fileinput-name').text(file.name);
        S.Util.fileToCanvas(file, function(canvas) {
          canvas.toBlob(function(blob) {
            var fieldName = $(evt.target).attr('name'),
                data = {
                  name: fieldName,
                  blob: blob,
                  file: canvas.toDataURL('image/jpeg')
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
          maxWidth: maxWidth || 800,
          maxHeight: maxHeight || 800,
          canvas: true
        });
      }
    },
    updatedRequiredOptionButtons: function(optionButtons) {
      var groupNames = []

      this.$(optionButtons || '[data-group-required]').each(function(index, btn) {
        groupNames.push($(btn).attr('name'));
      });

      _.chain(groupNames).uniq().each(function(groupName) {
        var groupOptions = this.$('[name="' + groupName + '"]');
        if (groupOptions.is(':checked')) {
          groupOptions.removeAttr('required');
        } else {
          groupOptions.attr('required', 'required');
        }
      }, this);
    },
    onRequiredOptionButtonChange: function(evt) {
      this.updatedRequiredOptionButtons(evt.currentTarget)
    },
    onSubmit: Gatekeeper.onValidSubmit(function(evt) {
      // Make sure that the center point has been set after the form was
      // rendered. If not, this is a good indication that the user neglected
      // to move the map to set it in the correct location.
      if (!this.center) {
        this.$('.drag-marker-instructions').addClass('is-visuallyhidden');
        this.$('.drag-marker-warning').removeClass('is-visuallyhidden');

        // Scroll to the top of the panel if desktop
        this.$el.parent('article').scrollTop(0);
        // Scroll to the top of the window, if mobile
        window.scrollTo(0, 0);
        return;
      }

      var router = this.options.router,
          model = this.model,
          // Should not include any files
          attrs = this.getAttrs(),
          $button = this.$('[name="save-place-btn"]'),
          spinner, $fileInputs;

      evt.preventDefault();

      $button.attr('disabled', 'disabled');
      spinner = new Spinner(S.smallSpinnerOptions).spin(this.$('.form-spinner')[0]);

      S.Util.log('USER', 'new-place', 'submit-place-btn-click');

      S.Util.setStickyFields(attrs, S.Config.survey.items, S.Config.place.items);

      // Save and redirect
      this.model.save(attrs, {
        success: function() {
          S.Util.log('USER', 'new-place', 'successfully-add-place');
          router.navigate('/place/' + model.id + '/new', {trigger: true});
        },
        error: function() {
          S.Util.log('USER', 'new-place', 'fail-to-add-place');
        },
        complete: function() {
          $button.removeAttr('disabled');
          spinner.stop();
        },
        wait: true
      });
    })
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
