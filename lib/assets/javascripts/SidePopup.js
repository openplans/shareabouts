L.SidePopup = L.Class.extend({
	includes: L.Mixin.Events,
	
	options: {
		maxHeight: 500,
		autoPan: true,
		closeButton: true,
		
		offset: new L.Point(0, 2),
		autoPanPadding: new L.Point(5, 5)
	},
	
	initialize: function(options) {
		L.Util.setOptions(this, options);		
	},
	
	onAdd: function(map) {
		this._map = map;
		if ( !this._map._panes.sidePopupPane ) {
		  this._initSidePopupPane();
		}
		if (!this._container) {
			this._initLayout();
		}
		
		this._container.style.opacity = '0';

		this._map._panes.sidePopupPane.appendChild(this._container);
		this._map.on('viewreset', this._updatePosition, this);
		if (this._map.options.closePopupOnClick) {
			this._map.on('preclick', this._close, this);
		}
		this._update();
		
		this._container.style.opacity = '1'; //TODO fix ugly opacity hack
		this._opened = true;
	},
	
	onRemove: function(map) {
		map._panes.sidePopupPane.removeChild(this._container);
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
	
	_initSidePopupPane: function() {
	  this._map._panes.sidePopupPane = this._map._createPane('shareabouts-side-popup-pane');
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
		L.DomEvent.disableClickPropagation(this._wrapper);
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
		this._container.style.whiteSpace = 'nowrap';

		var height = this._container.offsetHeight;
		
    this._container.style.height = (height > this.options.maxHeight ? this.options.maxHeight : height) + 'px';
		this._container.style.whiteSpace = '';
		
		this._containerHeight = this._container.offsetHeight;
	},
	
	_updatePosition: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng);
		this._containerLeft = pos.x + this.options.offset.x;
		this._containerTop = pos.y - Math.round(this._containerHeight/2) + this.options.offset.y;
		
		this._container.style.top = this._containerTop + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},
	
	_adjustPan: function() {
    return;
    // if (!this.options.autoPan) { return; }
		
		var containerHeight = this._container.offsetHeight,
			layerPos = new L.Point(
				this._containerLeft, 
				-containerHeight - this._containerBottom),
			containerPos = this._map.layerPointToContainerPoint(layerPos),
			adjustOffset = new L.Point(0, 0),
			padding = this.options.autoPanPadding,
			size = this._map.getSize();
		
		if (containerPos.x < 0) {
			adjustOffset.x = containerPos.x - padding.x;
		}
		if (containerPos.x + this._containerWidth > size.x) {
			adjustOffset.x = containerPos.x + this._containerWidth - size.x + padding.x;
		}
		if (containerPos.y < 0) {
			adjustOffset.y = containerPos.y - padding.y;
		}
		if (containerPos.y + containerHeight > size.y) {
			adjustOffset.y = containerPos.y + containerHeight - size.y + padding.y;
		}
		
		if (adjustOffset.x || adjustOffset.y) {
			this._map.panBy(adjustOffset);
		}
	},
	
	_onCloseButtonClick: function(e) {
		this._close();
		L.DomEvent.stop(e);
	}
});