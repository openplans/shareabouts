var Shareabouts = Shareabouts || {};

(function(S, moment){
  S.Util = {
    setPrettyDateLang: function(locale) {
      moment.lang(locale);
    },

    getPrettyDateTime: function(datetime) {
      return moment(datetime).fromNow();
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
        case "Chrome":
        case "Firefox":
        case "Safari":
          return true;
          break;
        case "Microsoft Internet Explorer":
          var firstDot = userAgent.browser.version.indexOf('.'),
              major = parseInt(userAgent.browser.version.substr(0, firstDot));

          if (major > 7) {
            return true;
          }
      }

      return false;
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
