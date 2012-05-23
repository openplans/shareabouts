(function(S){
  S.PopularitySlider = function(o) {
    var options = $.extend({
          target: '#map-container',
          title: 'Filter by Popularity',
          values: [],
          onFilter: function(){}
        }, o),
        self = {};


    // Popularity Filter
    $(options.target).hiderslider({
      title: options.title,
      slider: {
        max: options.values.length-1,
        slide: function(e, data) {
          options.onFilter(options.values[data.value]);
        },
        change: function(e, data) {
          options.onFilter(options.values[data.value]);
        }
      }
    });

    // Bind Events
    $(S).bind('resetPopularityFilter', function(){
      self.reset();
    });

    // Reset the slider when we're viewing a feature
    $(S).bind('viewFeature', function() {
      self.reset();
    });

    $(S).bind('locateNewFeature', function() {
      self.reset();
    });

    // Public Methods

    self.reset = function(){
      $(options.target).hiderslider('reset');
    };

    return self;
  };
})(Shareabouts);