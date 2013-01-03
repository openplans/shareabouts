var Shareabouts = Shareabouts || {};

(function(S, moment){
  S.Util = {
    setPrettyDateLang: function(locale) {
      moment.lang(locale);
    },

    getPrettyDateTime: function(datetime, format) {
      if (format) {
        return moment(datetime).format(format);
      } else {
        return moment(datetime).fromNow();
      }
    },

    getAttrs: function($form) {
      var attrs = {};

      // Get values from the form
      _.each($form.serializeArray(), function(item, i) {
        attrs[item.name] = item.value;
      });

      return attrs;
    },

    isSupported: function(userAgent) {
      switch (userAgent.browser.name) {
        case 'Chrome':
        case 'Firefox':
        case 'Safari':
          return true;
        case 'Microsoft Internet Explorer':
          var firstDot = userAgent.browser.version.indexOf('.'),
              major = parseInt(userAgent.browser.version.substr(0, firstDot), 10);

          if (major > 7) {
            return true;
          }
      }

      return false;
    },

    // http://stackoverflow.com/questions/4127829/detect-browser-support-of-html-file-input-element
    fileInputSupported: function() {
      var dummy = document.createElement('input');
      dummy.setAttribute('type', 'file');
      return dummy.disabled === false;
    },

    // For browsers without a console
    console: window.console || {
      log: function(){},
      debug: function(){},
      info: function(){},
      warn: function(){},
      error: function(){}
    }
  };
})(Shareabouts, moment);
