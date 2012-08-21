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