var Shareabouts = Shareabouts || {};

(function(S, moment){
  S.Util = {
    setPrettyDateLang: function(locale) {
      moment.lang(locale);
    },

    getPrettyDateTime: function(datetime) {
      return moment(datetime).fromNow();
    }
  };
})(Shareabouts, moment);