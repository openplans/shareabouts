(function(S){
  S.AddFeature = function(o) {
    var options = $.extend({}, o),
        $locateFeature = $(options.locateFeature),
        $finalizeFeature = $(options.finalizeFeature),
        self = {};


    // Public Methods

    self.reset = function(){
      $locateFeature.show();
      $finalizeFeature.hide();
    };

    self.hide = function() {
      $locateFeature.hide();
      $finalizeFeature.hide();
    };


    // Bind Events

    // UI Elements that affect map state
    $locateFeature.click( function(event) {
      $(S).trigger('locateNewFeature');
      $locateFeature.hide();
      $finalizeFeature.show();

      // TODO: FIX! Reset filtering
      $('#map-container').hiderslider('reset');
    });

    $finalizeFeature.click( function(event) {
      $(S).trigger('loadNewFeatureForm');
    });

    // Init the proper visibility
    self.reset();

    return self;
  };
})(Shareabouts);