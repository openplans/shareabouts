var Shareabouts = Shareabouts || {};

(function(S){
  S.TemplateHelpers = {
    insertInputTypeFlags: function(items) {
      _.each(items, function(item, index) {
        item.is_text = (item.type === 'text' || !item.type);
        item.is_textarea = (item.type === 'textarea');
        item.is_select = (item.type === 'select');
      });
    }
  };
})(Shareabouts);