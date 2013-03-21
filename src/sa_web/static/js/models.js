/*global _ Backbone jQuery */

var Shareabouts = Shareabouts || {};

(function(S, $) {
  'use strict';

  var normalizeModelArguments = function(key, val, options) {
    var attrs;
    if (key === null || _.isObject(key)) {
      attrs = key;
      options = val;
    } else if (key !== null) {
      (attrs = {})[key] = val;
    }
    options = options ? _.clone(options) : {};

    return {
      options: options,
      attrs: attrs
    };
  };

  S.ShareaboutsApiModel = Backbone.Model.extend({
    sync: function(method, model, options) {
      var data = model.toJSON();

      delete data.created_datetime;
      delete data.dataset;
      delete data.id;
      delete data.updated_datetime;

      options = options || {};
      options.contentType = 'application/json';
      options.data = JSON.stringify(data);

      Backbone.sync(method, model, options);
    }
  });

  S.SubmissionModel = S.ShareaboutsApiModel.extend({
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

  S.PlaceModel = S.ShareaboutsApiModel.extend({
    initialize: function(attributes, options) {
      this.responseCollection = new S.SubmissionCollection([], {
        placeModel: this,
        submissionType: options.responseType
      });

      this.supportCollection = new S.SubmissionCollection([], {
        placeModel: this,
        submissionType: options.supportType
      });

      var attachmentData = this.get('attachments') || [];
      this.attachmentCollection = new S.AttachmentCollection(attachmentData, {
        thingModel: this
      });
    },

    set: function(key, val, options) {
      var args = normalizeModelArguments(key, val, options);

      if (_.isArray(args.attrs.attachments) && this.attachmentCollection && !args.options.ignoreAttachnments) {
        this.attachmentCollection.reset(args.attrs.attachments);
      }

      return S.PlaceModel.__super__.set.call(this, args.attrs, args.options);
    },

    save: function(key, val, options) {
      // Overriding save so that we can handle adding attachments
      var self = this,
          realSuccessHandler,
          args = normalizeModelArguments(key, val, options),
          attrs = args.attrs;
      options = args.options;

      // If this is a new model, then we need to save it first before we can
      // attach anything to it.
      if (this.isNew()) {
        realSuccessHandler = options.success || $.noop;

        // Attach files after the model is succesfully saved
        options.success = function() {
          self.saveAttachments();
          realSuccessHandler.apply(this, arguments);
        };
      } else {
        // Model is already saved, attach away!
        self.saveAttachments();
      }

      options.ignoreAttachnments = true;
      S.PlaceModel.__super__.save.call(this, attrs, options);
    },

    saveAttachments: function() {
      this.attachmentCollection.each(function(attachment) {
        if (attachment.isNew()) {
          attachment.save();
        }
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
      options.responseType = this.options && this.options.responseType;
      options.supportType = this.options && this.options.supportType;
      return S.PlaceCollection.__super__.add.call(this, models, options);
    }
  });

  // This does not support editing at this time, which is why it is not a
  // ShareaboutsModel
  S.AttachmentModel = Backbone.Model.extend({
    idAttr: 'name',

    initialize: function(attributes, options) {
      this.options = options;
    },

    // TODO: We should be overriding sync instead of save here. The only
    // override for save should be to always use wait=True.
    save: function(key, val, options) {
      // Overriding save so that we can handle adding attachments
      var args = normalizeModelArguments(key, val, options),
          attrs = _.extend(this.attributes, args.attrs);

      return this._attachBlob(attrs.blob, attrs.name, args.options);
    },

    _attachBlob: function(blob, name, options) {
      var formData = new FormData(),
          progressHandler = S.Util.wrapHandler('progress', this, options.progress),
          myXhr = $.ajaxSettings.xhr();

      formData.append('file', blob);
      formData.append('name', name);

      options = options || {};

      $.ajax({
        url: this.collection.url(),
        type: 'POST',
        xhr: function() {  // custom xhr
          if(myXhr.upload){ // check if upload property exists
            myXhr.upload.addEventListener('progress', progressHandler, false); // for handling the progress of the upload
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

  S.AttachmentCollection = Backbone.Collection.extend({
    model: S.AttachmentModel,

    initialize: function(models, options) {
      this.options = options;
    },

    url: function() {
      var thingModel = this.options.thingModel,
          thingUrl = thingModel.url();

      return thingUrl + '/attachments/';
    }
  });

  S.ActivityCollection = Backbone.Collection.extend({
    url: '/api/activity/'
  });

}(Shareabouts, jQuery, Shareabouts.Util.console));

/*global jQuery */

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
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
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
