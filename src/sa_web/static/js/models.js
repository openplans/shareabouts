var Shareabouts = Shareabouts || {};

(function(S, $, console, loadImage) {
  var normalizeModelArguments = function(key, val, options) {
    var attrs;
    if (key == null || _.isObject(key)) {
      attrs = key;
      options = val;
    } else if (key != null) {
      (attrs = {})[key] = val;
    }
    options = options ? _.clone(options) : {};

    return {
      options: options,
      attrs: attrs
    };
  };

  S.SubmissionModel = Backbone.Model.extend({
    url: function() {
      // This is to make Django happy. I'm sad to have to add it.
      var url = S.SubmissionModel.__super__.url.call(this);
      url += url.charAt(url.length-1) === '/' ? '' : '/';

      return url;
    }
  });

  S.SubmissionCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.options = options;
    },

    model: S.SubmissionModel,

    url: function() {
      var submissionType = this.options.submissionType,
          placeId = this.options.placeModel.id;

      if (!placeId) { throw new Error('Place model id is not defined. You ' +
                                      'must save the Place before saving ' +
                                      'its ' + submissionType + '.'); }

      return '/api/places/' + placeId + '/' + submissionType + '/';
    }
  });

  S.PlaceModel = Backbone.Model.extend({
    initialize: function(attributes, options) {
      this.responseCollection = new S.SubmissionCollection([], {
        placeModel: this,
        submissionType: options.responseType
      });

      this.supportCollection = new S.SubmissionCollection([], {
        placeModel: this,
        submissionType: options.supportType
      });
    },
    save: function(key, val, options) {
      // Overriding save so that we can handle adding attachments
      var self = this,
          attachments,
          realSuccessHandler,
          args = normalizeModelArguments(key, val, options),
          attrs = args.attrs;
      options = args.options;

      // Can I assume these are always new?
      if (attrs.attachments) {
        attachments = attrs.attachments;
        delete attrs.attachments;

        // If this is a new model, then we need to save it first before we can
        // attach anything to it.
        if (this.isNew()) {
          realSuccessHandler = options.success || $.noop;

          // Attach files after the model is succesfully saved
          options.success = function() {
            self.attachFiles(attachments, {
              success: function() {
                // Call the success handler for the place now
                realSuccessHandler.apply(this, arguments);
              }
            });
          };
        } else {
          // Model is already saved, attach away!
          self.attachFiles(attachments);
        }
      }

      S.PlaceModel.__super__.save.call(this, attrs, options);
    },
    attachFiles: function(attachments, options) {
      options = options || {};

      var self = this,
          // Cache the success handler for all attachments
          realSuccessHandler = options.success || $.noop,
          attachmentResponses = [],
          // Set the attachments on the model AFTER we get all of the responses
          setAttachments = _.after(_.size(attachments), function(a) {
            self.set('attachments', a);
            realSuccessHandler.apply(self, attachments);
          });

      // attachments => {file_name: file_obj_from_form, ...}
      if (attachments) {
        options.success = function(data) {
          // Add the response to our list
          attachmentResponses.push(data);
          // Try to set attachments; will only be called after we get all
          // responses back.
          setAttachments(attachmentResponses);
        };

        _.each(attachments, function(file, name) {
          this.attachFile(file, name, options);
        }, this);
      }
    },
    attachFile: function(file, name, options) {
      var self = this;

      loadImage(file, function(canvas) {
        canvas.toBlob(function(blob) {
          self._attachBlob(blob, name, options);
        }, 'image/png');
      }, {
        // TODO: make configurable
        maxWidth: 800,
        maxHeight: 800,
        canvas: true
      });
    },

    _attachBlob: function(blob, name, options) {
      var formData = new FormData();
      formData.append('file', blob);
      formData.append('name', name);

      options = options || {};

      $.ajax({
        url: this.url() + '/attachments/',
        type: 'POST',
        xhr: function() {  // custom xhr
          myXhr = $.ajaxSettings.xhr();
          if(myXhr.upload){ // check if upload property exists
            myXhr.upload.addEventListener('progress', options.progress, false); // for handling the progress of the upload
          }
          return myXhr;
        },
        //Ajax events
        success: options.success,
        error: options.error,
        // Form data
        data: formData,
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false
      });
    }
  });

  S.PlaceCollection = Backbone.Collection.extend({
    url: '/api/places/',
    model: S.PlaceModel,

    initialize: function(models, options) {
      this.options = options;
    },

    add: function(models, options) {
      // Pass the submissionType into each PlaceModel so that it makes its way
      // to the SubmissionCollections
      options = options || {};
      options.responseType = this.options.responseType;
      options.supportType = this.options.supportType;
      return S.PlaceCollection.__super__.add.call(this, models, options);
    }
  });

  S.ActivityCollection = Backbone.Collection.extend({
    url: '/api/activity/'
  });

})(Shareabouts, jQuery, Shareabouts.Util.console, window.loadImage);
// NOTE: loadImage comes from the Load Image plugin in load-image.js


/*****************************************************************************

CSRF Validation
---------------
Django protects against Cross Site Request Forgeries (CSRF) by default. This
type of attack occurs when a malicious Web site contains a link, a form button
or some javascript that is intended to perform some action on your Web site,
using the credentials of a logged-in user who visits the malicious site in their
browser.

Since the API proxy view sends requests that write data to the Shareabouts
service authenticated as the owner of this dataset, we want to protect the API
view against CSRF. In order to ensure that AJAX POST/PUT/DELETE requests that
are made via jQuery will not be caught by the CSRF protection, we use the
following code. For more information, see:
https://docs.djangoproject.com/en/1.4/ref/contrib/csrf/

*/

jQuery(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }

    // If this is a DELETE request, explicitly set the data to be sent so that
    // the browser will calculate a value for the Content-Length header.
    if (settings.type === 'DELETE') {
        xhr.setRequestHeader("Content-Type", "application/json");
        settings.data = '{}';
    }
});
