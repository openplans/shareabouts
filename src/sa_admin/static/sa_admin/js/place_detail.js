/* global Shareabouts, L */
import { Component } from './component.js';
import { PlaceFieldWidget } from './place_field_widget.js';



class PlaceMap extends Component {
  constructor(el, place) {
    super(el);

    this.place = place;
    this.map = null;
    this.marker = null;
  }

  fill() {
    if (this.map === null) {
      this.map = L.map(this.el).setView([0, 0], 1);
      L.mapboxGL({
        accessToken: Shareabouts.bootstrapped.mapboxToken,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'mercator',
      }).addTo(this.map);
    }

    const geometry = this.place.get('geometry');
    if (!geometry) {
      console.warn(`Place ${this.place.get('id')} has no geometry`);
    }

    if (this.marker === null) {
      this.marker = L.marker(
        [geometry.coordinates[1], geometry.coordinates[0]],
        { draggable: true }
      )
      .bindTooltip('Drag to reposition...')
      .addTo(this.map);
    }

    this.map.setView([geometry.coordinates[1], geometry.coordinates[0]], 16);

    return this;
  }

  empty() {
    if (this.marker !== null) {
      this.marker.remove();
      this.marker = null;
    }

    return this;
  }

  bind() {
    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {

            // If this.el is a child of the added node, then call this.map.invalidateSize()
            // This is because the map is not visible when the component is first rendered
            // and the map is not sized correctly.
            if (node.contains(this.el)) {
              this.map.invalidateSize({ animate: false });

              // Disconnect the observer, as we no longer need to listen for changes.
              this.observer.disconnect();
              this.observer = null;
              return;
            }
          }
        }
      });
      this.observer.observe(document, {
          childList: true,
          subtree: true,
      });
    }

    this.listeners.add('click', this.map, (e) => {
      this.map.openPopup(`
        <button
          class="move-marker-button"
          data-lat="${e.latlng.lat}"
          data-lng="${e.latlng.lng}">Move marker here...</button>`, e.latlng);
    });

    this.listeners.add('click', this.el, (e) => {
      if (e.target.classList.contains('move-marker-button')) {
        e.preventDefault();
        const lat = parseFloat(e.target.dataset.lat);
        const lng = parseFloat(e.target.dataset.lng);
        this.marker.setLatLng([lat, lng]);
        this.map.closePopup();

        this.dispatcher.dispatchEvent(new CustomEvent('marker:move', {
          detail: { latlng: this.marker.getLatLng() },
        }));
      }
    });

    this.listeners.add('dragend', this.marker, (e) => {
      this.dispatcher.dispatchEvent(new CustomEvent('marker:move', {
        detail: { latlng: this.marker.getLatLng() },
      }));
    });

    return Component.prototype.bind.call(this);
  }

  unbind() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    return Component.prototype.unbind.call(this);
  }

  setCoordinates(coordinates) {
    if (this.marker.getLatLng().lat !== coordinates[1] ||
        this.marker.getLatLng().lng !== coordinates[0]) {
      this.marker.setLatLng([coordinates[1], coordinates[0]]);
      this.map.setView([coordinates[1], coordinates[0]], 16);
      return true;
    }
  }
};


class PlaceForm extends Component {
  constructor(el, place, columns) {
    super(el);

    this.place = place;
    this.columns = columns;
    this.undoBuffer = [];
    this.redoBuffer = [];
  }

  fill() {
    this.el.innerHTML = `
      <div class="actions-wrapper">
        <button class="undo-button" disabled>Undo</button>
        <button class="redo-button" disabled>Redo</button>
        <button class="save-button" disabled>Save</button>
      </div>
      <div class="map-wrapper"></div>
      <div class="fields-wrapper"></div>
    `;

    const mapEl = document.createElement('div');
    mapEl.id = 'place-map';
    mapEl.classList.add('map');
    this.map = new PlaceMap(mapEl, this.place);
    this.el.querySelector('.map-wrapper').appendChild(this.map.render().el);

    this.widgets = [];
    for (const column of this.columns) {
      const fieldEl = document.createElement('div');
      fieldEl.id = `place-${this.place.id}-${column.attr}-field`;
      fieldEl.classList.add('field');

      const WidgetType = column.widget || PlaceFieldWidget;
      const widget = new WidgetType(fieldEl, this.place, column);
      widget.render();
      this.widgets.push(widget);

      this.el.querySelector('.fields-wrapper').appendChild(fieldEl);
    }

    return this;
  }

  empty() {
    if (this.map) {
      this.map.empty();
    }
    if (this.widgets) {
      this.widgets.forEach((widget) => widget.empty());
    }
    return Component.prototype.empty.call(this);
  }

  bind() {
    this.listeners.add('marker:move', this.map.dispatcher, (e) => {
      this.setValues({
        'geometry': {
          type: 'Point',
          coordinates: [e.detail.latlng.lng, e.detail.latlng.lat],
        }
      });
    });

    for (const widget of this.widgets) {
      this.listeners.add('change', widget.dispatcher, (e) => {
        this.setValues({
          [e.detail.column.attr]: e.detail.value,
        });
      });
    }

    // Undo and redo buttons
    this.listeners.add('click', this.el.querySelector('.undo-button'), (e) => {
      e.preventDefault();
      this.undo();
    });

    this.listeners.add('click', this.el.querySelector('.redo-button'), (e) => {
      e.preventDefault();
      this.redo();
    });

    // Also bind undo and redo to ctrl+z and ctrl+y (cmd+z and cmd+y on Mac)
    this.listeners.add('keydown', document, (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });

    // Save button, or any other form submit
    this.listeners.add('submit', this.el, (e) => {
      e.preventDefault();
      this.saveValues();
    });

    return this;
  }

  enableSaveButton() {
    this.el.querySelector('.save-button').disabled = false;
  }

  disableSaveButton() {
    this.el.querySelector('.save-button').disabled = true;
  }

  syncAttrsToWidgets() {
    for (const widget of this.widgets) {
      widget.syncAttrToWidget();
    }

    this.map.setCoordinates(this.place.get('geometry').coordinates);
  }

  saveValues() {
    const saveButton = this.el.querySelector('.save-button');

    // const submitter = this.place.get('submitter');
    // if (submitter && submitter.id) {
    //   this.place.set('submitter', {id: submitter.id});
    // }

    this.place.save(null, {
      beforeSend: ($xhr) => {
        $xhr.setRequestHeader('X-Shareabouts-Silent', 'true');
      },
      error: () => {
        this.enableSaveButton()
        alert('Failed to save place. Please see the developer console for more information.');
      },
      wait: true
    });
    this.disableSaveButton();
  }

  setValues(data, options = {}) {
    const defaultOptions = { remember: true, appendLastUndo: false };
    options = { ...defaultOptions, ...options };

    let undoData = {};
    for (const [attr, value] of Object.entries(data)) {
      undoData[attr] = this.place.get(attr);
      console.log('Setting', attr, 'to', value);
      this.place.set(attr, value);
    }

    this.enableSaveButton();

    if (options.remember) {
      if (options.appendLastUndo) {
        const lastUndo = this.undoBuffer.pop() || {};
        undoData = { ...lastUndo, ...undoData };
      }
      this.undoBuffer.push(undoData);
      this.el.querySelector('.undo-button').disabled = false;
    }

    this.redoBuffer = [];
    this.el.querySelector('.redo-button').disabled = true;

    console.log('undoBuffer:', this.undoBuffer);
    console.log('redoBuffer:', this.redoBuffer);

    return this;
  }

  undo() {
    const undoData = this.undoBuffer.pop();
    if (this.undoBuffer.length === 0) {
      this.el.querySelector('.undo-button').disabled = true;
    }

    if (undoData) {
      const redoData = {};
      for (const attr in undoData) {
        redoData[attr] = this.place.get(attr);
        this.place.set(attr, undoData[attr]);
      }
      this.redoBuffer.push(redoData);
      this.el.querySelector('.redo-button').disabled = false;
    }

    this.syncAttrsToWidgets();
    this.enableSaveButton();

    console.log('undoBuffer:', this.undoBuffer);
    console.log('redoBuffer:', this.redoBuffer);

    return this;
  }

  redo() {
    const nextRedo = this.redoBuffer.pop();
    if (this.redoBuffer.length === 0) {
      this.el.querySelector('.redo-button').disabled = true;
    }

    if (nextRedo) {
      const lastUndo = {};
      for (const attr in nextRedo) {
        lastUndo[attr] = this.place.get(attr);
        this.place.set(attr, nextRedo[attr]);
      }
      this.undoBuffer.push(lastUndo);
      this.el.querySelector('.undo-button').disabled = false;
    }

    this.syncAttrsToWidgets();
    this.enableSaveButton();

    console.log('undoBuffer:', this.undoBuffer);
    console.log('redoBuffer:', this.redoBuffer);

    return this;
  }
};


class PlaceDetail extends Component {
  constructor(el, place, columns) {
    super(el);

    this.place = place;
    this.columns = columns;
  }

  fill() {
    const formEl = document.createElement('form');
    formEl.id = 'place-detail-form';
    this.form = new PlaceForm(formEl, this.place, this.columns);
    this.el.appendChild(this.form.render().el);
  }

  empty() {
    if (this.form) {
      this.form.empty();
    }
    return Component.prototype.empty.call(this);
  }
}


export {
  PlaceDetail,
};
