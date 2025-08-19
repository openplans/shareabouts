import { Component } from './component.js';

class PlacesTableHeaderCell extends Component {
  constructor(el, places, column) {
    super(el);

    this.places = places;
    this.column = column;
    this.filter = null;
  }

  clearFilter() {
    if (this.filter) {
      this.filter.clear();
      this.filter.filter();
    }
    return this;
  }

  fill() {
    this.el.innerHTML = `<span class="place-table-column-label">${this.column.label}</span>`;
    if (this.column.filter) {
      const filterEl = document.createElement('span');
      filterEl.classList.add('filter');

      const PlacesFilter = this.column.filter;
      this.filter = new PlacesFilter(filterEl, this.column);
      this.filter.render();
      this.el.appendChild(filterEl);
    }
    return this;
  }

  bind() {
    if (this.filter) {
      this.listeners.add('filter', this.filter.dispatcher, (e) => {
        this.updateFilterIndicator();
      });
    }
  }

  updateFilterIndicator() {
    if (this.filter && !this.filter.isClear()) {
      this.el.classList.add('filtered');
    } else {
      this.el.classList.remove('filtered');
    }
    return this;
  }
}


class PlacesTableHeaderRow extends Component {
  constructor(el, places, columns) {
    super(el);

    this.places = places;
    this.columns = columns;
    this.cells = [];
  }

  clearFilters() {
    for (const cell of this.cells) {
      cell.clearFilter();
    }
    return this;
  }

  fill() {
    for (const column of this.columns) {
      const th = document.createElement('th');
      th.classList.add(`${column.attr}-column`);
      const cell = new PlacesTableHeaderCell(th, this.places, column);
      this.el.appendChild(cell.render().el);
      this.cells.push(cell);
    }

    return this;
  }

  bind() {
    for (const cell of this.cells) {
      if (cell.filter) {
        this.listeners.add('filter', cell.filter.dispatcher, (e) => {
          this.dispatcher.dispatchEvent(new CustomEvent('filter', e.detail));
        });
      }
    }
  }

  unbind() {
    for (const cell of this.cells) {
      cell.unbind();
    }

    return Component.prototype.unbind.call(this);
  }
}


class PlacesTableBodyRow extends Component {
  constructor(el, place, columns) {
    super(el);

    this.place = place;
    this.columns = columns;
  }

  fill() {
    this.el.dataset.placeId = this.place.get('id');
    this.el.innerHTML = `
      ${this.columns.map((column) => `<td class="${column.attr}-column">${column.format(this.place.get(column.attr))}</td>`).join('')}
    `;

    return this;
  }

  empty() {
    Component.prototype.empty.call(this);
    delete this.el.dataset.placeId;
    return this;
  }

  bind() {
    return this;
  }
}


class PlacesTable extends Component {
  constructor(el, places, columns) {
    super(el);

    this.places = places;
    this.columns = columns;

    this.head = null;
    this.rows = {};
  }

  fill() {
    this.headEl = document.createElement('thead');
    this.head = new PlacesTableHeaderRow(document.createElement('tr'), this.places, this.columns);
    this.headEl.appendChild(this.head.render().el);
    this.el.appendChild(this.headEl);

    this.bodyEl = document.createElement('tbody');
    for (const place of this.places.models) {
      const placeId = place.get('id');


      if (!this.rows[placeId]) {
        this.rows[placeId] = new PlacesTableBodyRow(document.createElement('tr'), place, this.columns);
      }
      this.rows[placeId].render();
      this.bodyEl.appendChild(this.rows[placeId].el);
    }
    this.el.appendChild(this.bodyEl);

    return this;
  }

  bind() {
    if (this.head) {
      this.listeners.add('filter', this.head.dispatcher, (e) => {
        this.dispatcher.dispatchEvent(new CustomEvent('filter', e.detail));
      });
    }

    for (const tr of this.el.querySelectorAll('tbody tr')) {
      this.listeners.add('mouseover', tr, (e) => {
        const placeId = e.currentTarget.dataset.placeId;
        this.highlightRow(placeId, e.currentTarget);
        this.dispatcher.dispatchEvent(new CustomEvent('place:mouseover', { detail: { placeId } }));
      });

      this.listeners.add('mouseout', tr, (e) => {
        const placeId = e.currentTarget.dataset.placeId;
        this.unhighlightRow(placeId, e.currentTarget);
        this.dispatcher.dispatchEvent(new CustomEvent('place:mouseout', { detail: { placeId } }));
      });

      this.listeners.add('click', tr, (e) => {
        const placeId = e.currentTarget.dataset.placeId;
        this.dispatcher.dispatchEvent(new CustomEvent('place:click', { detail: { placeId } }));
      });
    }

    return Component.prototype.bind.call(this);
  }

  unbind() {
    if (this.head) { this.head.unbind(); }
    for (const row of Object.values(this.rows)) { row.unbind(); }

    return Component.prototype.unbind.call(this);
  }

  filterRows(predicates) {
    for (const [placeId, row] of Object.entries(this.rows)) {
      const place = this.places.get(placeId);
      const matches = predicates.every((predicate) => predicate(place));

      if (matches) {
        this.bodyEl.appendChild(row.el);
      } else if (this.bodyEl.contains(row.el)) {
        this.bodyEl.removeChild(row.el);
      }
    }
  }

  clearFilters() {
    this.head.clearFilters();
    return this;
  }

  highlightRow(placeId, tr = null) {
    tr ||= this.el.querySelector(`tr[data-place-id="${placeId}"]`);
    if (tr) {
      tr.classList.add('highlight');
    }
  }

  unhighlightRow(placeId, tr = null) {
    tr ||= this.el.querySelector(`tr[data-place-id="${placeId}"]`);
    if (tr) {
      tr.classList.remove('highlight');
    }
  }

  scrollToRow(placeId) {
    const row = this.el.querySelector(`tr[data-place-id="${placeId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

export {
  PlacesTable,
};
