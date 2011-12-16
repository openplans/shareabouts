var InformationPanel = (function () {
  
  // Constructor & Public methods  
  var init = function (config) {
    this.options = {
      layerId      : 'mapPopup',
      mapContainer : $("#map"),
      onclicks     : {},
      onRemove     : function() {}, // callback after panels is 'closed'
      onOpen       : function() {}  // callback after panel is opened
    };
    
    $.extend(true, this.options, config);
    
    var self = this;
    
    this.container   = $("<div>").attr({ id : this.options.layerId, "class" : "information-panel", style : "display:none;" });
    this.contentWrap = $("<div>").attr({ "class" : "information-panel-content" });
    this.closeButton = $("<a>").attr({ "class" : "close", href : "#" }).text("close [x]");
    
    this.options.mapContainer.append( this.container.append(this.contentWrap).append(this.closeButton) );
    
    // Prevent propogation of events to map
    L.DomEvent.disableClickPropagation( this.container[0] );
    L.DomEvent.addListener(this.container[0], 'touchmove', L.DomEvent.stopPropagation);
		L.DomEvent.addListener(this.container[0], 'touchend', L.DomEvent.stopPropagation);
		L.DomEvent.addListener(this.container[0], 'touchstart', L.DomEvent.stopPropagation);
		
    this.closeButton.click( function(clickEvent){
      clickEvent.preventDefault();
      self.remove();
    });
    
    this.container.click( function(clickEvent) {
      for (selector in self.options.onclicks) {        
  	    if ($(clickEvent.target).is(selector))
  	      self.options.onclicks[selector](clickEvent);
  	    else {
  	      var parent = $(clickEvent.target).closest(selector);
          if (parent[0]) self.options.onclicks[selector](clickEvent) 
  	    }
  	  }
    });
    
    this.addClickEventListener = function(selector, callback) {
      this.options.onclicks[selector] = callback;
    };
    
    this.open = function( ) {
      this.container.show();
      this.options.onOpen(); // trigger callback
    }
    
    this.setContent = function(content) {
      this.contentWrap.html(content);
    };
    
    this.remove = function() {
      this.container.hide();
      this.options.onRemove(); // trigger callback
    };
    
    // Placeholder while transitioning from leaflet popup
    this.setLatLng = function(latLng) {
      return true;
    };
    
    // Underscore while transitioning from leaflet popup
    this._opened = function() {
      return this.container.is(":visible");
    };
  };
  
  return init;
})();