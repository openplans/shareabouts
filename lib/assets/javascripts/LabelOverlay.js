L.LabelOverlay = L.Class.extend({
  initialize: function( latLng, label, options) {
    this._latlng = latLng;
    this._label = label;
    L.Util.setOptions(this, options);
  },
  options: {
    offset: new L.Point(0, 2)
  },
  onAdd: function(map) {
    this._map = map;
    if (!this._container) {
        this._initLayout();
    }
    map.getPanes().overlayPane.appendChild(this._container);
    this._container.innerHTML = this._label;
    map.on('viewreset', this._reset, this);
    this._reset();
  },
  onRemove: function(map) {
    map.getPanes().overlayPane.removeChild(this._container);
    map.off('viewreset', this._reset, this);
  },
  _reset: function() {
    var pos = this._map.latLngToLayerPoint(this._latlng);
    var op = new L.Point(pos.x + this.options.offset.x, pos.y - this.options.offset.y);
    L.DomUtil.setPosition(this._container, op);
  },
  _initLayout: function() {
    this._container = L.DomUtil.create('div', 'shareabouts-label-overlay');
  }
});