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
    
    this.container       = $("<div>").attr({ id : this.options.layerId, "class" : "information-panel", style : "display:none;" });
    this.contentWrapper  = $("<div>").attr({ "class" : "information-panel-content-wrap" });
    this.content         = $("<div>").attr({ "class" : "information-panel-content" });
    this.closeButton     = $("<a>").attr({ "class" : "close", href : "#" }).text("close [x]");
    this.popupTip        = $("<div>").attr("class", "popup-tip");
    this.popupTipWrapper = $("<div>").attr("class", "popup-tip-wrapper");
    
    this.options.mapContainer.append( 
      this.container.
      append(
        this.contentWrapper.append(this.content)
      ).
      append(this.closeButton).
      append(
        this.popupTipWrapper.append(this.popupTip)
      ) 
    );
    
    this.contentWrapper.mobileScroll(); // enable 1 finger scrolling in mobile safari
    
    // Prevent propogation of events to map
    L.DomEvent.disableClickPropagation( this.container[0] );
    L.DomEvent.addListener(this.container[0], 'touchmove', L.DomEvent.stopPropagation);
    L.DomEvent.addListener(this.container[0], 'touchend', L.DomEvent.stopPropagation);
    L.DomEvent.addListener(this.container[0], 'touchstart', L.DomEvent.stopPropagation);
    L.DomEvent.addListener(this.container[0], 'mousewheel', L.DomEvent.stopPropagation);
    
    this.closeButton.click( function(clickEvent){
      clickEvent.preventDefault();
      self.remove();
    });

    this.container.click( function(clickEvent) {
      if ($(clickEvent.target).is("textarea")) $(clickEvent.target).focus();
    })

    this.container.click( function(clickEvent) {
      for (selector in self.options.onclicks) {        
        if ($(clickEvent.target).is(selector)){
          clickEvent.preventDefault();
          self.options.onclicks[selector](clickEvent);
        } else {
          var parent = $(clickEvent.target).closest(selector);
          if (parent[0]) {
            clickEvent.preventDefault();
            self.options.onclicks[selector](clickEvent);
          }
        }
      }
    });
    
    // Public Methods!
    
    this.positionFor = function(smallScreen, element) {
      if (smallScreen) {
        this.popupTipWrapper.show();
        var bottom = element ? this.options.mapContainer[0].offsetHeight - (element.offset().top - this.options.mapContainer.offset().top) : 0;
        this.setStyle("bottom", bottom + "px");
        this.setStyle("left", "0.5em");
        this.setStyle("width", "auto");
      } else {
        this.popupTipWrapper.hide();
        this.setStyle("bottom", "1em");
        this.setStyle("left", "auto");
        this.setStyle("width", "50%");
      }
    };

    this.addClickEventListener = function(selector, callback) {
      this.options.onclicks[selector] = callback;
    };

    this.open = function( ) {
      this.container.show();
      this.options.onOpen(); // trigger callback
    }

    this.setContent = function(content) {
      this.content.html(content);
    };

    this.remove = function() {
      this.container.hide();
      this.options.onRemove(); // trigger callback
    };

    this.setStyle = function(property, value) {
      this.container.css(property, value);
    };

    // Underscore while transitioning from leaflet popup
    this._opened = function() {
      return this.container.is(":visible");
    };
  };
  
  return init;
})();