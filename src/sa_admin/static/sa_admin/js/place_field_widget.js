import { Component } from './component.js';


class PlaceFieldWidget extends Component {
  constructor(el, place, column) {
    super(el);

    this.place = place;
    this.column = column;
  }

  get widgetId() {
    return `place-${this.place.id}-${this.column.attr}-widget`;
  }

  get widgetHtml() {
    return `
      <label for="${this.widgetId}">${this.column.label}</label>
      <input
        type="text"
        id="${this.widgetId}"
        name="${this.column.attr}"
        value="${this.place.get(this.column.attr) || ''}"
      >
    `
  }

  get widgetValueEls() {
    return this.el.querySelectorAll('input');
  }

  get widgetValue() {
    return this.widgetValueEls[0].value;
  }

  syncAttrToWidget() {
    const value = this.place.get(this.column.attr) || '';
    if (this.widgetValueEls[0].value !== value) {
      this.widgetValueEls[0].value = value;
      return true;
    }
  }

  fill() {
    this.el.innerHTML = this.widgetHtml;
    return this;
  }

  bind() {
    for (const el of this.widgetValueEls) {
      this.listeners.add('change', el, () => {
        this.dispatcher.dispatchEvent(new CustomEvent('change', {
          detail: { column: this.column, value: this.widgetValue },
        }));
      });
    }

    return this;
  }
};

class PlaceFieldReadOnlyWidget extends PlaceFieldWidget {
  get widgetHtml() {
    return `
      <label for="${this.widgetId}">${this.column.label}</label>
      <input
        type="text"
        id="${this.widgetId}"
        name="${this.column.attr}"
        value="${this.place.get(this.column.attr) || ''}"
        readonly
        disabled
      >
    `;
  }
};

class PlaceFieldBooleanWidget extends PlaceFieldWidget {
  get widgetHtml() {
    return `
      <label class="checkbox-label" for="${this.widgetId}">${this.column.label}</label>
      <input
        type="checkbox"
        id="${this.widgetId}"
        name="${this.column.attr}"
        ${this.place.get(this.column.attr) ? 'checked' : ''}
      >
    `;
  }

  get widgetValue() {
    return this.widgetValueEls[0].checked;
  }

  syncAttrToWidget() {
    const value = this.place.get(this.column.attr) || false;
    if (this.widgetValueEls[0].checked !== value) {
      this.widgetValueEls[0].checked = value;
      return true;
    }
  }
};

class PlaceFieldChoiceWidget extends PlaceFieldWidget {
  get widgetHtml() {
    const attrValue = this.place.get(this.column.attr);
    const options = this.column.options.map((option) => {
      return `
        <option
        ${attrValue === option.value ? 'selected' : ''}
          value="${option.value}">${option.label}</option>`;
    }).join('');

    return `
      <label for="${this.widgetId}">${this.column.label}</label>
      <select
        id="${this.widgetId}"
        name="${this.column.attr}"
      >${options}</select>
    `;
  }

  get widgetValueEls() {
    return this.el.querySelectorAll('select');
  }

  syncAttrToWidget() {
    const value = this.place.get(this.column.attr);
    let changed = false;

    for (const optionEl of this.widgetValueEls[0].options) {
      if (optionEl.value === value && !optionEl.selected) {
        optionEl.selected = true;
        changed = true;
      } else if (optionEl.value !== value && optionEl.selected) {
        optionEl.selected = false;
        changed = true;
      }
    }

    return changed;
  }
};

function datetimeUtcToLocal(datetime) {
  if (!datetime) { return datetime };

  const date = new Date(datetime);
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  const str = `${date.toISOString().slice(0, 19)}${offset < 0 ? '+' : '-'}${Math.abs(offset / 60).toString().padStart(2, '0')}:${Math.abs(offset % 60).toString().padStart(2, '0')}`;

  return str
}

function datetimeLocalToUTC(datetime) {
  if (!datetime) { return datetime };

  const date = new Date(datetime);
  const str = date.toISOString();

  return str;
}

class PlaceFieldDateTimeWidget extends PlaceFieldWidget {
  get widgetHtml() {
    const attrValue = this.place.get(this.column.attr);
    const localValue = datetimeUtcToLocal(attrValue);
    return `
      <label for="${this.widgetId}">${this.column.label}</label>
      <input
        type="datetime-local"
        id="${this.widgetId}"
        name="${this.column.attr}"
        value="${localValue.slice(0, 19)}"
      >
    `;
  }

  get widgetValue() {
    const localValue = this.widgetValueEls[0].value;
    return datetimeLocalToUTC(localValue);
  }

  syncAttrToWidget() {
    const utcValue = this.place.get(this.column.attr);
    const localValue = datetimeUtcToLocal(utcValue);
    const naiveValue = localValue.slice(0, 19);

    if (this.widgetValueEls[0].value !== naiveValue) {
      this.widgetValueEls[0].value = localValue.slice(0, 19);
      return true;
    }
  }
};

class PlaceFieldLongTextWidget extends PlaceFieldWidget {
  get widgetHtml() {
    return `
      <label for="${this.widgetId}">${this.column.label}</label>
      <textarea
        id="${this.widgetId}"
        name="${this.column.attr}"
      >${this.place.get(this.column.attr) || ''}</textarea>
    `;
  }

  get widgetValueEls() {
    return this.el.querySelectorAll('textarea');
  }
};

export {
  PlaceFieldWidget,
  PlaceFieldBooleanWidget,
  PlaceFieldChoiceWidget,
  PlaceFieldDateTimeWidget,
  PlaceFieldReadOnlyWidget,
  PlaceFieldLongTextWidget,
};