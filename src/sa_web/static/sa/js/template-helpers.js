var Shareabouts = Shareabouts || {};

(function(S){
  S.TemplateHelpers = {
    insertInputTypeFlags: function(configItems) {
      _.each(configItems, function(item, index) {
        item.is_input = (!item.type || (item.type !== 'textarea' &&  item.type !== 'select'));
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
    },

    overridePlaceTypeConfig: function(configItems, defaultPlaceTypeName) {
      var placeTypeConfig = _.find(configItems, function(config){
        return config.name === 'location_type';
      });

      if (defaultPlaceTypeName || placeTypeConfig.options.length === 1){
        placeTypeConfig.type = 'hidden';
        placeTypeConfig.prompt = null;

        if (defaultPlaceTypeName) {
          placeTypeConfig.attrs = {key: 'value', value: defaultPlaceTypeName};
        } else {
          placeTypeConfig.attrs = {key: 'value', value: placeTypeConfig.options[0]};
        }

        delete placeTypeConfig.options;
      }
    }
  };
})(Shareabouts);