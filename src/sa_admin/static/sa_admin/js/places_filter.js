import { Component } from './component.js';


class PlacesFilter extends Component {
  constructor(el, column) {
    super(el);
    this.column = column;
  }

  get filterName() {
    return `places-${this.column.attr}-filter`;
  }

  get filterHtml() {
    return `
      <p>The <code>${this.column.label}</code> field should contain the following text:</p>
      <input type="text" name="${this.filterName}">
    `;
  }

  get filterData() {
    return {
      type: 'substring',
      value: this.el.querySelector('input').value
    };
  }

  filterPredicate(place) {
    const { value: filterValue } = this.filterData;
    if (!filterValue) { return true; }

    const attrValue = place.get(this.column.attr) || '';
    return attrValue.includes(filterValue);
  }

  clear() {
    this.el.querySelector('input').value = '';
    return this;
  }

  filter() {
    this.dispatcher.dispatchEvent(new CustomEvent('filter', {
      detail: { column: this.column, func: this.filterPredicate },
    }));
    return this;
  }

  isClear() {
    return !this.el.querySelector('input').value;
  }

  fill() {
    this.el.innerHTML = `
      <span class="places-filter">
        <button class="filter-button">Filter</button>
      </span>

      <dialog class="filter-dialog">
        <header>
          <h2>${this.column.label}</h2>
          <button class="close">Close</button>
        </header>
        <form method="dialog">
          ${this.filterHtml}
          <button type="submit">Apply</button>
        </form>
      </dialog>
    `;
    return this;
  }

  bind() {
    const filterButton = this.el.querySelector('.filter-button');
    const filterDialog = this.el.querySelector('.filter-dialog');

    this.listeners.add('click', filterButton, () => {
      filterDialog.showModal();
    });

    const filterForm = this.el.querySelector('form');
    const closeButton = this.el.querySelector('button.close');

    this.listeners.add('submit', filterForm, (e) => {
      this.filter();
    });

    this.listeners.add('click', closeButton, () => {
      filterDialog.close();
    });

    return this;
  }
};


class PlacesBooleanFilter extends PlacesFilter {
  get filterHtml() {
    return `
      <p>The <code>${this.column.label}</code> field should be:</p>
      <label>
        <input type="radio" name="${this.filterName}" value="true">
        True
      </label>
      <label>
        <input type="radio" name="${this.filterName}" value="false">
        False
      </label>
      <label>
        <input type="radio" name="${this.filterName}" value="null" checked>
        Either True or False
      </label>
    `;
  }

  filterPredicate(place) {
    const filterValue = this.el.querySelector('input:checked').value;
    const attrValue = place.get(this.column.attr);

    if (filterValue === 'null') {
      return true;
    } else if (filterValue === 'true') {
      return attrValue === 'true' || attrValue === true;
    } else if (filterValue === 'false') {
      return attrValue === 'false' || attrValue === false;
    }
  }

  clear() {
    this.el.querySelector('input[value="null"]').checked = true;
    return this;
  }

  isClear() {
    return this.el.querySelector('input[value="null"]').checked;
  }
};


class PlacesChoiceFilter extends PlacesFilter {
  get filterHtml() {
    const options = this.column.options.map((option) => {
      return `
        <label>
          <input type="checkbox" name="${this.filterName}" value="${option.value}">
          ${option.label}
        </label>
      `;
    }).join('');

    return `
      <p>The <code>${this.column.label}</code> field should be one of the following values:</p>
      ${options}
    `;
  }

  filterPredicate(place) {
    const filterValues = Array.from(this.el.querySelectorAll('input:checked')).map((input) => input.value);
    if (filterValues.length === 0) { return true; }

    const attrValue = place.get(this.column.attr);
    return filterValues.includes(attrValue);
  }

  clear() {
    for (const input of this.el.querySelectorAll('input')) {
      input.checked = false;
    }
    return this;
  }

  isClear() {
    return this.el.querySelectorAll('input:checked').length === 0;
  }
};


class PlacesDateTimeFilter extends PlacesFilter {
  get filterHtml() {
    return `
      <p>The <code>${this.column.label}</code> field should be between:</p>
      <label>
        From <input type="datetime-local" name="${this.filterName}-from">
      </label>
      <label>
        To <input type="datetime-local" name="${this.filterName}-to">
      </label>
    `;
  }

  filterPredicate(place) {
    const fromDatetime = this.el.querySelector(`[name="${this.filterName}-from"]`).value;
    const toDatetime = this.el.querySelector(`[name="${this.filterName}-to"]`).value;
    const attrValue = place.get(this.column.attr);
    return (!fromDatetime || new Date(attrValue) >= new Date(fromDatetime)) &&
           (!toDatetime || new Date(attrValue) <= new Date(toDatetime));
  }

  clear() {
    this.el.querySelector(`[name="${this.filterName}-from"]`).value = '';
    this.el.querySelector(`[name="${this.filterName}-to"]`).value = '';
    return this;
  }

  isClear() {
    return !this.el.querySelector(`[name="${this.filterName}-from"]`).value &&
           !this.el.querySelector(`[name="${this.filterName}-to"]`).value;
  }
};


class PlacesSubstringFilter extends PlacesFilter {
};


export {
  PlacesFilter,
  PlacesBooleanFilter,
  PlacesChoiceFilter,
  PlacesDateTimeFilter,
  PlacesSubstringFilter,
};