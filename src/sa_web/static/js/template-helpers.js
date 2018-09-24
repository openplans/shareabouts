var Shareabouts = Shareabouts || {};

(function(S){
  S.TemplateHelpers = {
    // Attached helper properties for how to display this form element
    insertInputTypeFlags: function(configItems) {
      _.each(configItems, function(item, index) {
        item.is_input = (!item.type || (
                            item.type !== 'textarea' &&
                            item.type !== 'select' &&
                            item.type !== 'radiogroup' &&
                            item.type !== 'checkboxgroup' &&
                            item.type !== 'file' &&
                            item.type !== 'location'
                          ));
        item.is_textarea = (item.type === 'textarea');
        item.is_select = (item.type === 'select');
        item.is_radiogroup = (item.type === 'radiogroup');
        item.is_checkboxgroup = (item.type === 'checkboxgroup');
        item.is_file = (item.type === 'file');
        item.is_fileinput_supported = S.Util.fileInputSupported();
        item.is_location = (item.type === 'location');
      });
    },

    // Normalize a list of items to display in a template
    getItemsFromModel: function(configItems, model, exceptions) {
      // Filter out any items that will be handled specifically in the template
      var filteredConfigItems = _.filter(configItems, function(item){
            // Only include if it is not an exception
            return _.indexOf(exceptions, item.name) === -1;
          }),
          items = [];

      // Normalize the list
      _.each(filteredConfigItems, function(item, j){
        items.push({
          name: item.name,
          label: item.label,
          value: model.get(item.name)
        });
      });

      return items;
    },

    // Don't show a place type select element if only one option or a default
    // value is provided.
    overridePlaceTypeConfig: function(placeConfigItems, defaultPlaceTypeName) {
      var valueAttr,
          // Get the config for the place type
          placeTypeConfig = _.find(placeConfigItems, function(config){
            return config.name === 'location_type';
          });


      if (placeTypeConfig && placeTypeConfig.type === 'select' && (defaultPlaceTypeName ||
        (_.isArray(placeTypeConfig.options) && placeTypeConfig.options.length === 1))) {

        // Change to a hidden element with no label
        placeTypeConfig.type = 'hidden';
        placeTypeConfig.prompt = null;

        // Use defult or the one option
        if (defaultPlaceTypeName) {
          valueAttr = {key: 'value', value: defaultPlaceTypeName};
        } else {
          valueAttr = {key: 'value', value: placeTypeConfig.options[0]};
        }

        // options are not longer needed since this is not a select element
        delete placeTypeConfig.options;

        // Figures out if we an replace the attrs or have to update them
        if (_.isArray(placeTypeConfig.attrs) && placeTypeConfig.attrs.length > 0) {
          _.each(placeTypeConfig.attrs, function(kvp, i){
            if (kvp.key === 'value') {
              placeTypeConfig.attrs[i] = valueAttr;
            }
          });
        } else {
          placeTypeConfig.attrs = [ valueAttr ];
        }

      }
    }
  };
})(Shareabouts);
