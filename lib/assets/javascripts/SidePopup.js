/**
 * Custom Popup for Leaflet, developed specifically for Shareabouts. 
 * Requires jQuery for handling clicks within popup.
 */
L.SidePopup = L.Class.extend({
	includes: L.Mixin.Events,
	
	options: {
		autoPan: true,
		closeButton: true,
		margin: 20, // margin from map edges on top and bottom 
		offset: new L.Point(-5,-21), // accounting for standard leaflet marker
		autoPanPadding: new L.Point(5, 5),
		onclicks: {} // maps selectors to functions to be fired on click of selector
	},
	
	initialize: function(options) {
		L.Util.setOptions(this, options);		
	},
	
	onAdd: function(map) {
		this._map = map;
		if (!this._container) {
			this._initLayout();
		}
		
		this._container.style.opacity = '0';

		this._map._panes.popupPane.appendChild(this._container);
		this._map.on('viewreset', this._updatePosition, this);
		if (this._map.options.closePopupOnClick) {
			this._map.on('preclick', this._close, this);
		}
		this._update();
		
		this._container.style.opacity = '1'; //TODO fix ugly opacity hack
		this._opened = true;
	},
	
	onRemove: function(map) {
		map._panes.popupPane.removeChild(this._container);
		map.off('viewreset', this._updatePosition, this);
		map.off('click', this._close, this);

		this._container.style.opacity = '0';
		
		this._opened = false;
	},
	
	setLatLng: function(latlng) {
		this._latlng = latlng;
		if (this._opened) {
			this._update();
		}
		return this;
	},
	
	setContent: function(content) {
		this._content = content;
		if (this._opened) {
			this._update();
		}
		return this;
	},
	
	addClickEventListener: function(selector, callback) {
	  this.options.onclicks[selector] = callback;
	},
	
	_close: function() {
		if (this._opened) {
			this._map.removeLayer(this);
		}
	},
	
	_initLayout: function() {
		this._container = L.DomUtil.create('div', 'shareabouts-side-popup');
		
		this._closeButton = L.DomUtil.create('a', 'shareabouts-side-popup-close-button', this._container);
		this._closeButton.href = '#close';
		this._closeButton.onclick = L.Util.bind(this._onCloseButtonClick, this);
		
		
		this._tipContainer = L.DomUtil.create('div', 'shareabouts-side-popup-tip-container', this._container);
		this._tip = L.DomUtil.create('div', 'shareabouts-side-popup-tip', this._tipContainer);
		
		this._wrapper = L.DomUtil.create('div', 'shareabouts-side-popup-content-wrapper', this._container);
		
		// Disables click from propogating to map, also disables handling of clicks within popup
    L.DomEvent.disableClickPropagation(this._wrapper);
    L.DomEvent.addListener(this._wrapper, 'touchmove', L.DomEvent.stopPropagation);
		L.DomEvent.addListener(this._wrapper, 'touchend', L.DomEvent.stopPropagation);
		L.DomEvent.addListener(this._wrapper, 'touchstart', L.DomEvent.stopPropagation);
    
    // Catch clicks, and if we have a callback for this target, fire it
    var self = this;
    $(this._wrapper).click(function(mouseEvent) {
      for (selector in self.options.onclicks) {        
  	    if ($(mouseEvent.target).is(selector))
  	      self.options.onclicks[selector](mouseEvent);
  	    else {
  	      var parent = $(mouseEvent.target).closest(selector);
          if (parent[0]) self.options.onclicks[selector](mouseEvent) 
  	    }
  	  }
  	});
    
		this._contentNode = L.DomUtil.create('div', 'shareabouts-side-popup-content', this._wrapper);
	},
		
	_update: function() {
		this._container.style.visibility = 'hidden';
		
		this._updateContent();
		this._updateLayout();
		this._updatePosition();
		
		this._container.style.visibility = '';

		this._adjustPan();
	},
	
	_updateContent: function() {
		if (!this._content) return;
		
		if (typeof this._content == 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			this._contentNode.innerHTML = '';
			this._contentNode.appendChild(this._content);
		}
	},
	
	_updateLayout: function() {
    this._container.style.height = '';
    this._container.style.width = '';
		this._container.style.whiteSpace = 'nowrap';
		
		this._closeButton.style.top = (this.options.margin + 10) + "px";

		var mapHeight = this._map._container.offsetHeight;
		var mapWidth  = this._map._container.offsetWidth;
		
		this._containerHeight = mapHeight - this.options.margin * 2;
		this._containerWidth  = mapWidth - 40; // hm
		
    this._container.style.height =  this._containerHeight + 'px';
    this._container.style.width =  this._containerWidth / 2 + 'px';
    this._container.style.paddingTop = this.options.margin + 'px';
		this._container.style.whiteSpace = '';
		
		this._tipContainerTop = this._containerHeight / 2 + this.options.offset.y;
		this._tipContainer.style.top = this._tipContainerTop + 'px';
	},
	
	_updatePosition: function() {	  
    var pos = this._map.latLngToLayerPoint(this._latlng);
    
		this._containerTop  = -pos.y + this._map._container.offsetHeight/2;
		this._containerLeft = pos.x + this.options.offset.x;
		
		this._container.style.top  = this._containerTop + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},
	
	_adjustPan: function() {
    if (!this.options.autoPan) { return; }
    
    this._map.panTo(this._latlng);
	},
	
	_onCloseButtonClick: function(e) {
		this._close();
		L.DomEvent.stop(e);
	}
});