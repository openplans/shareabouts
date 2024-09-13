function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}


class EventListenerTracker {
  constructor() {
    this.cache = [];
  }

  add(event, el, callback) {
    el.addEventListener(event, callback);
    this.cache.push({ event, el, callback });
  }

  remove(event, el, callback) {
    el.removeEventListener(event, callback);
    this.cache = this.cache.filter((listener) => {
      return listener.event !== event || listener.el !== el || listener.callback !== callback;
    });
  }

  clear() {
    this.cache.forEach(({ event, el, callback }) => {
      el.removeEventListener(event, callback);
    });
    this.cache = [];
  }
}


class Component {
  constructor(el) {
    this.el = el;
    this.listeners = new EventListenerTracker();
    this.dispatcher = new EventTarget();
  }

  fill() {
    return this;
  }

  empty() {
    this.el.innerHTML = '';
    return this;
  }

  bind() {
    return this;
  }

  unbind() {
    this.listeners.clear();
    return this;
  }

  render() {
    this.unbind();
    this.empty();
    this.fill();
    this.bind()
    return this;
  }
}


export {
  htmlToElement,
  Component,
  EventListenerTracker,
};
