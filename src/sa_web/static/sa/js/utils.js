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
    }
  };
})(Shareabouts, moment);
