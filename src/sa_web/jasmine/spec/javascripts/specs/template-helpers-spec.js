describe('template-helpers.js', function() {

  var getConfigItems = function(type) {
    return [
      { name: 'foo', prompt: 'Foo', label: 'The Foo', type: type, attrs: [] }
    ];
  };

  describe('insertInputTypeFlags', function() {

    it('should handle textarea type', function() {
      var configItems = getConfigItems('textarea');

      Shareabouts.TemplateHelpers.insertInputTypeFlags(configItems);
      expect(configItems[0].is_input).toBe(false);
      expect(configItems[0].is_textarea).toBe(true);
      expect(configItems[0].is_select).toBe(false);
    });

    it('should handle select type', function() {
      var configItems = getConfigItems('select');

      Shareabouts.TemplateHelpers.insertInputTypeFlags(configItems);
      expect(configItems[0].is_input).toBe(false);
      expect(configItems[0].is_textarea).toBe(false);
      expect(configItems[0].is_select).toBe(true);
    });

    it('should handle text type', function() {
      var configItems = getConfigItems('text');

      Shareabouts.TemplateHelpers.insertInputTypeFlags(configItems);
      expect(configItems[0].is_input).toBe(true);
      expect(configItems[0].is_textarea).toBe(false);
      expect(configItems[0].is_select).toBe(false);
    });

    it('should handle hidden type', function() {
      var configItems = getConfigItems('hidden');

      Shareabouts.TemplateHelpers.insertInputTypeFlags(configItems);
      expect(configItems[0].is_input).toBe(true);
      expect(configItems[0].is_textarea).toBe(false);
      expect(configItems[0].is_select).toBe(false);
    });

    it('should handle number type', function() {
      var configItems = getConfigItems('number');

      Shareabouts.TemplateHelpers.insertInputTypeFlags(configItems);
      expect(configItems[0].is_input).toBe(true);
      expect(configItems[0].is_textarea).toBe(false);
      expect(configItems[0].is_select).toBe(false);
    });
  });


  describe('getItemsFromModel', function() {
    var configItems, model;

    beforeEach(function(){
      configItems = getConfigItems('text');
      model = new Backbone.Model({ foo: 'OpenPlans' });
    });

    it('should return a list of objects', function() {
      var items = Shareabouts.TemplateHelpers.getItemsFromModel(configItems, model);

      expect(_.isArray(items)).toBe(true);
      expect(_.isObject(items[0])).toBe(true);
    });

    it('should set label from the config', function() {
      var items = Shareabouts.TemplateHelpers.getItemsFromModel(configItems, model);
      expect(items[0].label).toBe('The Foo');
    });

    it('should set name from the config', function() {
      var items = Shareabouts.TemplateHelpers.getItemsFromModel(configItems, model);
      expect(items[0].name).toBe('foo');
    });

    it('should set value from the model', function() {
      var items = Shareabouts.TemplateHelpers.getItemsFromModel(configItems, model);
      expect(items[0].value).toBe('OpenPlans');
    });

    it('should set not include an item if its config name is in the exclusions', function() {
      var items = Shareabouts.TemplateHelpers.getItemsFromModel(configItems, model, ['foo']);
      expect(items.length).toBe(0);
    });

  });


  describe('overridePlaceTypeConfig', function() {
    var placeConfig, defaultPlaceTypeName = 'Park';

    var getValueAttr = function(attrs) {
      return _.find(attrs, function(kvp) {
        return kvp.key === 'value';
      });
    };

    beforeEach(function(){
      placeConfig = {"items": [
        // This is the important one
        {"prompt": "Location Type", "type": "select", "options": ["Landmark", "Park", "School"], "name": "location_type"},
        {"prompt": "Location Name", "type": "text", "name": "name", "attrs": [{"key": "placeholder", "value": "Location Name"}, {"key": "size", "value": 30}]},
        {"prompt": "Your Name", "type": "text", "name": "submitter_name", "optional": true, "attrs": [{"key": "placeholder", "value": "Name"}, {"key": "size", "value": 30}]},
        {"prompt": "Description", "type": "textarea", "name": "description", "optional": true, "attrs": [{"key": "placeholder", "value": "Description..."}]}
      ], "adding_supported": true, "title": "Tell us more..."};
    });

    it('should override the place type config item to a hidden input if a default place type is provided', function() {
      Shareabouts.TemplateHelpers.overridePlaceTypeConfig(placeConfig.items, defaultPlaceTypeName);
      expect(placeConfig.items[0].type).toBe('hidden');
    });

    it('should override the place type config item to a blank prompt if a default place type is provided', function() {
      Shareabouts.TemplateHelpers.overridePlaceTypeConfig(placeConfig.items, defaultPlaceTypeName);
      expect(placeConfig.items[0].prompt).toBe(null);
    });

    it('should override value attr when the attrs array is undefined', function() {
      Shareabouts.TemplateHelpers.overridePlaceTypeConfig(placeConfig.items, defaultPlaceTypeName);
      var valAttr = getValueAttr(placeConfig.items[0].attrs);
      expect(valAttr.value).toBe(defaultPlaceTypeName);
    });

    it('should override value attr when the attrs array is defined', function() {
      var items = [{"prompt": "Location Type", "type": "select", "options": ["Landmark", "Park", "School"], "name": "location_type",
      attrs: [{key: 'value', value: 'OpenPlans'}]}];

      var valAttr = getValueAttr(items[0].attrs);
      expect(valAttr.value).toBe('OpenPlans');

      Shareabouts.TemplateHelpers.overridePlaceTypeConfig(items, defaultPlaceTypeName);

      valAttr = getValueAttr(items[0].attrs);
      expect(valAttr.value).toBe(defaultPlaceTypeName);
    });

    it('should only override select elements', function() {
      var items = [{"prompt": "Location Type", "type": "hidden", "name": "location_type", attrs: [{key: 'value', value: 'OpenPlans'}]}];
      Shareabouts.TemplateHelpers.overridePlaceTypeConfig(items, defaultPlaceTypeName);

      var valAttr = getValueAttr(items[0].attrs);
      expect(valAttr.value).toBe('OpenPlans');
    });

  });

});
