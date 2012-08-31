var Shareabouts = Shareabouts || {};

(function(S){
  S.TemplateHelpers = {
    insertInputTypeFlags: function(configItems) {
      _.each(configItems, function(item, index) {
        item.is_text = (item.type === 'text' || !item.type);
        item.is_textarea = (item.type === 'textarea');
        item.is_select = (item.type === 'select');
      });
    },

    getItemsFromModel: function(configItems, model, exceptions) {
      var filteredConfigItems = _.filter(configItems, function(item){
            // Only include if it is not an exception
            return _.indexOf(exceptions, item.name) === -1;
          }),
          items = [];

      _.each(filteredConfigItems, function(item, j){
        items.push({
          name: item.name,
          label: item.label,
          value: model.get(item.name)
        });
      });

      return items;
    }
  };
})(Shareabouts);