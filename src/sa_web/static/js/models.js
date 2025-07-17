/*global _, Backbone, jQuery */

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

  S.PaginatedCollection = Backbone.Collection.extend({
    resultsAttr: 'results',

    parse: function(response) {
      this.metadata = response.metadata;
      return response[this.resultsAttr];
    },

    fetchNextPage: function(success, error) {
      var collection = this;

      if (this.metadata.next) {
        collection.fetch({
          remove: false,
          url: collection.metadata.next,
          success: success,
          error: error
        });
      }
    },

    fetchAllPages: function(options) {
      var self = this,
          onFirstPageSuccess, onPageComplete,
          onPageSuccess, onPageError,
          onAllSuccess, onAnyError,
          attemptedPages = 0, totalPages = 1;

      options = options || {};
      options.data = options.data || {};

      if (options.error) {
        onAnyError = _.once(options.error);
      }

      onFirstPageSuccess = function(obj, data) {
        // Calculate the total number of pages based on the size of the rist
        // page, assuming all pages except the last will be the same size.
        var pageSize = data[self.resultsAttr].length, i;
        totalPages = Math.ceil(data.metadata.length / pageSize);

        if (options.success) {
          onAllSuccess = _.after(totalPages, options.success);
        }

        // Fetch all the rest of the pages in parallel.
        if (data.metadata.next) {
          for (i = 2; i <= totalPages; i++) {
            self.fetch(_.defaults({
              remove: false,
              data: _.defaults({ page: i }, options.data),
              complete: onPageComplete,
              success: onPageSuccess,
              error: onPageError
            }, options));
          }
        }

        onPageSuccess.apply(this, arguments);
      };

      onPageComplete = function() {
        attemptedPages++;
        if (options.pageComplete) { options.pageComplete.apply(this, arguments); }
        if (attemptedPages === totalPages && options.complete) { options.complete.apply(this, arguments); }
      };

      onPageSuccess = function() {
        if (options.pageSuccess) { options.pageSuccess.apply(this, arguments); }
        if (onAllSuccess) { onAllSuccess.apply(this, arguments); }
      };

      onPageError = function() {
        if (options.pageError) { options.pageError.apply(this, arguments); }
        if (onAnyError) { onAnyError.apply(this, arguments); }
      };

      this.fetch(_.defaults({
        // Note that success gets called before complete, which is imprtant
        // because complete should know whether correct total number of pages.
        // However, if the request for the first page fails, complete will
        // assume one page.
        success: onFirstPageSuccess,
        error: onPageError,
        complete: onPageComplete
      }, options));
    }
  });

  S.SubmissionCollection = S.PaginatedCollection.extend({
    initialize: function(models, options) {
      this.options = options;
    },

    url: function() {
      var submissionType = this.options.submissionType,
          placeId = this.options.placeModel && this.options.placeModel.id;

      if (!submissionType) { throw new Error('submissionType option' +
                                                     ' is required.'); }

      if (!placeId) { throw new Error('Place model id is not defined. You ' +
                                      'must save the place before saving ' +
                                      'its ' + submissionType + '.'); }

      return S.Util.prefixApiEndpoint('/places/' + placeId + '/' + submissionType);
    },

    comparator: 'created_datetime'
  });

  S.PlaceModel = Backbone.Model.extend({
    initialize: function() {
      var attachmentData;

      this.submissionSets = {};

      _.each(this.get('submission_sets'), function(submissions, name) {
        var models = [];

        // It's a summary if it's not an array of objects
        if (_.isArray(submissions)) {
          models = submissions;
        }

        this.submissionSets[name] = new S.SubmissionCollection(models, {
          submissionType: name,
          placeModel: this
        });
      }, this);

      attachmentData = this.get('attachments') || [];
      this.attachmentCollection = new S.AttachmentCollection(attachmentData, {
        thingModel: this
      });

      this.attachmentCollection.each(function(attachment) {
        attachment.set({saved: true});
      });
    },

    set: function(key, val, options) {
      var args = normalizeModelArguments(key, val, options);

      if (_.isArray(args.attrs.attachments) && this.attachmentCollection && !args.options.ignoreAttachments) {
        this.attachmentCollection.reset(args.attrs.attachments);
      }

      _.each(args.attrs.submission_sets, function(submissions, name) {
        // It's a summary if it's not an array of objects
        if (this.submissionSets && this.submissionSets[name] && _.isArray(submissions)) {
          this.submissionSets[name].reset(submissions);
        }
      }, this);

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

      options.ignoreAttachments = true;
      S.PlaceModel.__super__.save.call(this, attrs, options);
    },

    saveAttachments: function() {
      this.attachmentCollection.each(function(attachment) {
        if (attachment.isNew()) {
          attachment.save();
        }
      });
    },

    parse: function(response) {
      var properties = _.clone(response.properties);
      properties.geometry = _.clone(response.geometry);
      return properties;
    },

    queryString: function() {
      var params = {};
      if (S.currentUserIsPlaceModerator()) {
        params['include_invisible'] = 'true';
      }

      return Object.keys(params).length > 0 ? '?' + $.param(params) : '';
    },

    sync: function(method, model, options) {
      var attrs;

      if (method === 'create' || method === 'update' || method === 'patch') {
        attrs = {
          'type': 'Feature',
          'geometry': model.get('geometry'),
          'properties': options.attrs || _.omit(model.toJSON(), 'geometry')
        };

        options.data = JSON.stringify(attrs);
        options.contentType = 'application/json';
      }

      options.url = _.result(this, 'url') + this.queryString();

      return Backbone.sync(method, model, options);
    }
  });

  S.PlaceCollection = S.PaginatedCollection.extend({
    url: S.Util.prefixApiEndpoint('/places'),
    model: S.PlaceModel,
    resultsAttr: 'features',

    fetchByIds: function(ids, options) {
      var base = _.result(this, 'url');

      if (ids.length === 1) {
        this.fetchById(ids[0], options);
      } else {
        ids = _.map(ids, function(id) { return encodeURIComponent(id); });
        options = options ? _.clone(options) : {};
        options.url = base + (base.charAt(base.length - 1) === '/' ? '' : '/') + ids.join(',');

        this.fetch(_.extend(
          {remove: false},
          options
        ));
      }
    },

    fetchById: function(id, options) {
      options = options ? _.clone(options) : {};
      var self = this,
          place = new S.PlaceModel(),
          success = options.success;

      place.id = id;
      place.collection = self;

      options.success = function() {
        var args = Array.prototype.slice.call(arguments);
        self.add(place);
        if (success) {
          success.apply(this, args);
        }
      };
      place.fetch(options);
    }
  });

  // This does not support editing at this time, which is why it is not a
  // ShareaboutsModel
  S.AttachmentModel = Backbone.Model.extend({
    idAttribute: 'name',

    initialize: function(attributes, options) {
      this.options = options;
    },

    isNew: function() {
      return this.get('saved') !== true;
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
          self = this,
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
        success: function() {
          var args = Array.prototype.slice.call(arguments);

          // Set the save attribute on the incoming data so that we know it's
          // not new.
          args[0].saved = true;
          self.set({saved: true});

          if (options.success) {
            options.success.apply(this, args);
          }

        },
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

      return thingUrl + '/attachments';
    }
  });

  S.ActionCollection = S.PaginatedCollection.extend({
    url: S.Util.prefixApiEndpoint('/actions'),
    comparator: function(a, b) {
      if (a.get('created_datetime') > b.get('created_datetime')) {
        return -1;
      } else {
        return 1;
      }
    }
  });

  // Users aren't technically backbone models, but there are some useful
  // methods that we can define for them.
  S.currentUserGroups = function () {
    var datasetGroups = _.filter(S.bootstrapped.currentUser && S.bootstrapped.currentUser.groups, function(userGroup) {
      return S.bootstrapped.dataset.replace(/\/$/, '') === userGroup.dataset.split('?')[0].replace(/\/$/, '');
    });
    return _.pluck(datasetGroups, 'name');
  };

  S.currentUserInGroup = function (group) {
    return _.some(S.currentUserGroups(), function(userGroup) { return group === userGroup; });
  };

  S.currentUserInAnyGroup = function (groups) {
    if (_.isArray(groups)) {
      return _.some(groups, function(g) { return S.currentUserInGroup(g); });
    } else {
      return S.currentUserInGroup(groups);
    }
  };

  S.currentUserIsPlaceModerator = function () {
    return S.currentUserInAnyGroup(S.Config.place.moderators);
  }

  S.currentUserIsPlaceEditor = function () {
    return S.currentUserInAnyGroup(S.Config.place.editors);
  }

}(Shareabouts, jQuery));

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
