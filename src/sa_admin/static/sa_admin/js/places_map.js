/* global L */

import * as d3Color from 'https://cdn.jsdelivr.net/npm/d3-color@3.1.0/+esm'
import { Component } from "./component.js";

window.hsl = d3Color.hsl;
class PlacesMap extends Component {
  constructor(el, places) {
    super(el);

    this.places = places;
    this.map = null;
    this.placesLayer = L.featureGroup();

    this._placeIdToMarker = {};
  }

  fill() {
    this.cacheCategoryColors();

    if (this.map === null) {
      this.map = L.map(this.el, {zoomSnap: 0}).setView([0, 0], 1);
      L.mapboxGL({
        accessToken: Shareabouts.bootstrapped.mapboxToken,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'mercator',
      }).addTo(this.map);
      this.placesLayer.addTo(this.map);
    }

    for (const place of this.places.models) {
      const geometry = place.get('geometry');
      if (geometry === null) {
        console.warn(`Place ${place.get('id')} has no geometry`);
      }

      const marker = L.circleMarker(
        [geometry.coordinates[1], geometry.coordinates[0]],
        this.normalMarkerStyle(place),
      ).addTo(this.placesLayer);

      marker.place = place;
      marker.placeId = place.get('id');
      this._placeIdToMarker[place.get('id')] = marker;
    }

    if (this.places.models.length > 0) {
      this.map.fitBounds(this.placesLayer.getBounds(), {padding: [50, 50]});
    }

    return this;
  }

  empty() {
    this.placesLayer.clearLayers();
    this._placeIdToMarker = {};
    return this;
  }

  bind() {
    this.placesLayer.eachLayer((marker) => {
      const placeId = marker.placeId;
      this.listeners.add('mouseover', marker, () => {
        this.highlightMarker(placeId, marker);
        this.showMarkerPopup(placeId, marker);
        this.dispatcher.dispatchEvent(new CustomEvent('place:mouseover', { detail: { placeId } }));
      });
      this.listeners.add('mouseout', marker, () => {
        this.unhighlightMarker(placeId, marker);
        this.dispatcher.dispatchEvent(new CustomEvent('place:mouseout', { detail: { placeId } }));
      });
      this.listeners.add('click', marker, () => {
        this.dispatcher.dispatchEvent(new CustomEvent('place:click', { detail: { placeId } }));
      });
    });
    return this;
  }

  cacheCategoryColors() {
    this.cachedColors = {};
    this.usedColors = {};
    for (const category of Object.keys(Shareabouts.Config.place_types)) {
      const color = Shareabouts.Config.place_types[category].color;
      if (color === undefined) {
        console.warn(`No color for category ${category}; generating one...`);
      } else {
        this.cachedColors[category] = color;
      }
    }
  }

  colorForCategory(category) {
    let color = this.cachedColors[category];

    if (color === undefined) {
      if (Object.keys(this.cachedColors).length === 0) {
        color = this.cachedColors[category] = '#cc0000';
      }
      else if (Object.keys(this.cachedColors).length === 1) {
        const hsl = d3Color.hsl(Object.values(this.cachedColors)[0]);
        hsl.h = (hsl.h + 180) % 360;
        color = this.cachedColors[category] = hsl.formatHex();
      }
      else {
        const colors = Object.values(this.cachedColors);
        const hsls = colors.map(c => d3Color.hsl(c));

        // Find the two most distant colors that haven't been used yet
        let hsl1, hsl2, color1, color2, maxdist;
        for (let i = 0; i < hsls.length; ++i) {
          for (let j = i + 1; j < hsls.length; ++j) {
            color1 = colors[i];
            color2 = colors[j];
            if (this.usedColors[color1] && this.usedColors[color1].includes(color2)) {
              continue;
            }

            const dist = Math.pow((hsls[i].h - hsls[j].h) / 360.0, 2)
                       + Math.pow(hsls[i].s - hsls[j].s, 2)
                       + Math.pow(hsls[i].l - hsls[j].l, 2);
            if (hsl1 === undefined || dist > maxdist) {
              hsl1 = hsls[i];
              hsl2 = hsls[j];
              maxdist = dist;
            }
          }
        }

        // Find the color between them
        const hsl = d3Color.hsl(
          (hsl1.h + hsl2.h) / 2,
          (hsl1.s + hsl2.s) / 2,
          (hsl1.l + hsl2.l) / 2,
        );
        color = this.cachedColors[category] = hsl.formatHex();

        // Update this.usedColors
        color1 = hsl1.formatHex();
        color2 = hsl2.formatHex();
        this.usedColors[color1] ||= [];
        this.usedColors[color1].push(color2);
      }

      console.warn(`Generated color ${color} for category ${category}`);
    }

    return color;
  }

  normalMarkerStyle(place) {
    return {
      radius: 5,
      color: this.colorForCategory(place.get('location_type')),
      fillOpacity: 0.5,
      opacity: 1,
      weight: 1,
    };
  }

  hoverMarkerStyle(place) {
    return {
      radius: 8,
      color: 'white',
      fillColor: this.colorForCategory(place.get('location_type')),
      fillOpacity: 1,
      opacity: 1,
      weight: 2,
    };
  }

  filterMarkers(predicates) {
    for (const marker of Object.values(this._placeIdToMarker)) {
      const place = marker.place;
      const match = predicates.every((predicate) => predicate(place));

      if (match) {
        marker.addTo(this.placesLayer);
      } else {
        marker.removeFrom(this.placesLayer);
      }
    }
  }

  highlightMarker(placeId, marker = null) {
    marker ||= this._placeIdToMarker[placeId];
    if (marker) {
      marker.setStyle(this.hoverMarkerStyle(marker.place));
      marker.bringToFront();
    }
  }

  unhighlightMarker(placeId, marker = null) {
    marker ||= this._placeIdToMarker[placeId];
    if (marker) {
      marker.setStyle(this.normalMarkerStyle(marker.place));
    }
  }

  markerPopupContent(place) {
    return `
      <div>
        ID: ${place.id}
        <button class="btn edit-place">Edit</button>
        <button class="btn show-place-in-list">Show in List</button>
      </div>
    `;
  }

  showMarkerPopup(placeId, marker = null) {
    marker ||= this._placeIdToMarker[placeId];
    if (marker) {
      this.markerPopup = this.markerPopup || L.popup();
      this.markerPopup.setContent(this.markerPopupContent(marker.place));
      this.markerPopup.setLatLng(marker.getLatLng());
      this.markerPopup.openOn(this.map);
      
      const popupEl = this.markerPopup.getElement();
      this.listeners.add('click', popupEl.querySelector('.edit-place'), () => {
        this.dispatcher.dispatchEvent(new CustomEvent('place:click', { detail: { placeId } }));
      });
      this.listeners.add('click', popupEl.querySelector('.show-place-in-list'), () => {
        this.dispatcher.dispatchEvent(new CustomEvent('place:reveal', { detail: { placeId } }));
      });
    }
  }

  hideMarkerPopup() {
    if (this.markerPopup) {
      this.markerPopup.remove();
      this.markerPopup = null;
    }
  }
}

export { PlacesMap };
