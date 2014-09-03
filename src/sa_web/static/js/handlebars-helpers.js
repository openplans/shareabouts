/*global Handlebars _ moment */

var Shareabouts = Shareabouts || {};

(function(NS) {
  Handlebars.registerHelper('STATIC_URL', function() {
    return NS.bootstrapped.staticUrl;
  });

  Handlebars.registerHelper('debug', function(value) {
    if (typeof(value) === typeof({})) {
      return JSON.stringify(value, null, 4);
    } else {
      return value;
    }
  });

  Handlebars.registerHelper('current_url', function() {
    return window.location.toString();
  });

  Handlebars.registerHelper('permalink', function() {
    return window.location.toString();
  });

  Handlebars.registerHelper('is', function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // Current user -------------------------------------------------------------

  Handlebars.registerHelper('is_authenticated', function(options) {
    return (NS.bootstrapped && NS.bootstrapped.currentUser) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('current_user', function(attr) {
    return (NS.bootstrapped.currentUser ? NS.bootstrapped.currentUser[attr] : undefined);
  });

  // Date and time ------------------------------------------------------------

  Handlebars.registerHelper('formatdatetime', function(datetime, format) {
    if (datetime) {
      return moment(datetime).format(format);
    }
    return datetime;
  });

  Handlebars.registerHelper('fromnow', function(datetime) {
    if (datetime) {
      return moment(datetime).fromNow();
    }
    return '';
  });

  // String -------------------------------------------------------------------

  Handlebars.registerHelper('truncatechars', function(text, maxLength, continuationString) {
    if (_.isUndefined(continuationString) || !_.isString(continuationString)) {
      continuationString = '...';
    }

    if (text && text.length > maxLength) {
      return text.slice(0, maxLength - continuationString.length) + continuationString;
    } else {
      return text;
    }
  });

  Handlebars.registerHelper('is_submitter_name', function(options) {
    return (this.name === 'submitter_name') ? options.fn(this) : options.inverse(this);
  });

  // Place Details ------------------------------------------------------------
  Handlebars.registerHelper('action_text', function() {
    return NS.Config.place.action_text || '';
  });

  Handlebars.registerHelper('place_type_label', function(typeName) {
    var placeType = NS.Config.placeTypes[typeName];
    return placeType ? (placeType.label || typeName) : '';
  });

  Handlebars.registerHelper('anonymous_name', function(typeName) {
    return NS.Config.place.anonymous_name;
  });

  Handlebars.registerHelper('survey_label_by_count', function() {
    var count = 0,
        submissionSet;

    if (this.submission_sets && this.submission_sets[NS.Config.survey.submission_type]) {
      submissionSet = this.submission_sets[NS.Config.survey.submission_type];
      count = submissionSet ? submissionSet.length : 0;
    }

    if (count === 1) {
      return NS.Config.survey.response_name;
    }
    return NS.Config.survey.response_plural_name;
  });

  Handlebars.registerHelper('survey_label', function() {
    return NS.Config.survey.response_name;
  });

  Handlebars.registerHelper('survey_label_plural', function() {
    return NS.Config.survey.response_plural_name;
  });

  Handlebars.registerHelper('support_label', function() {
    return NS.Config.support.response_name;
  });

  Handlebars.registerHelper('support_label_plural', function() {
    return NS.Config.support.response_plural_name;
  });


  Handlebars.registerHelper('survey_count', function() {
    var count = 0,
        submissionSet;

    if (this.submission_sets && this.submission_sets[NS.Config.survey.submission_type]) {
      submissionSet = this.submission_sets[NS.Config.survey.submission_type];
      count = submissionSet ? submissionSet.length : 0;
    }

    return count;
  });


  // Gets the value for the given object and key. Useful for using the value
  // of a token as a key.
  Handlebars.registerHelper('get_value', function(obj, key, options) {
    return obj[key];
  });

  // Similar to the helper in our shared handlebars helpers repo, but gets the
  // value via a given object and key (like get_value).
  Handlebars.registerHelper('select_item_value', function(obj, key, options) {
    var value = obj[key],
        $el = $('<div/>').html(options.fn(this)),
        selectValue = function(v) {
          $el.find('[value="'+v+'"]').attr({
            checked: 'checked',
            selected: 'selected'
          });
        };

    if ($.isArray(value)) {
      jQuery.each(function(i, v) {
        selectValue(v);
      });
    } else {
      selectValue(value);
    }

    return $el.html();
  });

  Handlebars.registerHelper('each_place_item', function() {
    var result = '',
        args = Array.prototype.slice.call(arguments),
        exclusions, options;

    options = args.slice(-1)[0];
    exclusions = args.slice(0, args.length-1);


    _.each(NS.Config.place.items, function(item, i) {
      var newItem = {
            name: item.name,
            label: item.label,
            value: this[item.name]
          };

      // if not an exclusion and not private data
      if (_.contains(exclusions, item.name) === false &&
          item.name.indexOf('private-') !== 0) {
        result += options.fn(newItem);
      }
    }, this);

    return result;
  });

  Handlebars.registerHelper('place_url', function(place_id) {
    var l = window.location,
        protocol = l.protocol,
        host = l.host;

    return [protocol, '//', host, '/place/', place_id].join('');
  });

}(Shareabouts));
