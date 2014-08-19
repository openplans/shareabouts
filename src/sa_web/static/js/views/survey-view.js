/*globals jQuery Backbone _ Handlebars Spinner Gatekeeper */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.SurveyView = Backbone.View.extend({
    events: {
      'submit form': 'onSubmit',
      'click .reply-link': 'onReplyClick'
    },
    initialize: function() {
      S.TemplateHelpers.insertInputTypeFlags(this.options.surveyConfig.items);

      this.collection.on('reset', this.onChange, this);
      this.collection.on('add', this.onChange, this);
    },

    render: function() {
      var self = this,
          responses = [],
          url = window.location.toString(),
          urlParts = url.split('response/'),
          // will be "mobile" or "desktop", as defined in default.css
          layout = window.getComputedStyle(document.body,':after').getPropertyValue('content'),
          responseIdToScrollTo,
          $responseToScrollTo;

      // get the response id from the url
      if (urlParts.length === 2) {
        responseIdToScrollTo = urlParts[1];
      }

      // I don't understand why we need to redelegate the event here, but they
      // are definitely unbound after the first render.
      this.delegateEvents();

      // Responses should be an array of objects with submitter_name,
      // pretty_created_datetime, and items (name, label, and prompt)
      this.collection.each(function(model, i) {
        var items = S.TemplateHelpers.getItemsFromModel(self.options.surveyConfig.items, model, ['submitter_name']);

        responses.push(_.extend(model.toJSON(), {
          submitter_name: model.get('submitter_name') || self.options.surveyConfig.anonymous_name,
          pretty_created_datetime: S.Util.getPrettyDateTime(model.get('created_datetime'),
            self.options.surveyConfig.pretty_datetime_format),
          items: items
        }));
      });

      this.$el.html(Handlebars.templates['place-detail-survey']({
        responses: responses,
        has_single_response: (responses.length === 1),
        user_token: this.options.userToken,
        survey_config: this.options.surveyConfig
      }));

      // get the element based on the id
      $responseToScrollTo = this.$el.find('[data-response-id="'+ responseIdToScrollTo +'"]');

      // call scrollIntoView()
      if ($responseToScrollTo.length > 0) {
        setTimeout(function() {
          // For desktop, the panel content is scrollable
          if (layout === 'desktop') {
            $('#content article').scrollTo($responseToScrollTo);
          } else {
            // For mobile, it's the window
            $(window).scrollTo($responseToScrollTo);
          }
        }, 700);
      }

      return this;
    },

    remove: function() {
      this.unbind();
      this.$el.remove();
    },

    onChange: function() {
      this.render();
    },

    onSubmit: Gatekeeper.onValidSubmit(function(evt) {
      evt.preventDefault();
      var self = this,
          $form = this.$('form'),
          $button = this.$('[name="commit"]'),
          attrs = S.Util.getAttrs($form),
          spinner;

      // Disable the submit button until we're done, so that the user doesn't
      // over-click it
      $button.attr('disabled', 'disabled');
      spinner = new Spinner(S.smallSpinnerOptions).spin(this.$('.form-spinner')[0]);

      S.Util.log('USER', 'place', 'submit-reply-btn-click', this.collection.options.placeModel.getLoggingDetails(), this.collection.size());

      // Create a model with the attributes from the form
      this.collection.create(attrs, {
        wait: true,
        success: function() {
          // Clear the form
          $form.get(0).reset();
          S.Util.log('USER', 'place', 'successfully-reply', self.collection.options.placeModel.getLoggingDetails());
        },
        error: function() {
          S.Util.log('USER', 'place', 'fail-to-reply', self.collection.options.placeModel.getLoggingDetails());
        },
        complete: function() {
          // No matter what, enable the button
          $button.removeAttr('disabled');
          spinner.stop();
        }
      });
    }),

    onReplyClick: function(evt) {
      evt.preventDefault();
      this.$('textarea, input').not('[type="hidden"]').first().focus();
      S.Util.log('USER', 'place', 'leave-reply-btn-click', this.collection.options.placeModel.getLoggingDetails(), this.collection.size());
    }

  });

}(Shareabouts, jQuery, Shareabouts.Util.console));
