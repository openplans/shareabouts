function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}


class EventListenerTracker {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Adds an event listener to the specified element.
   * @param {string} event - The event type.
   * @param {Element} el - The element to add the listener to.
   * @param {Function} callback - The event handler function.
   */
  add(event, el, callback) {
    el.addEventListener(event, callback);

    const key = {event, el};
    const callbacks = this.cache.get(key) || [];
    callbacks.push(callback);
    this.cache.set(key, callbacks);
  }

  /**
   * Removes an event listener from the specified element.
   * @param {string} event - The event type.
   * @param {Element} el - The element to remove the listener from.
   * @param {Function} callback - The event handler function to remove.
   */
  remove(event, el, callback) {
    el.removeEventListener(event, callback);

    const key = {event, el};
    const callbacks = this.cache.get(key) || [];
    this.cache.set(key, callbacks.filter((cb) => cb !== callback));
  }

  /**
   * Clears event listeners from the cache. Optionally only clear listeners for
   * a specific element and/or event type.
   * @param {Element} options.el - The element to clear listeners from.
   * @param {string} options.event - The event type to clear listeners for.
   */
  clear(options = {}) {
    this.cache.forEach((callbacks, key) => {
      if (options.event && key.event !== options.event) return;
      if (options.el && key.el !== options.el) return;

      callbacks.forEach((cb) => {
        key.el.removeEventListener(key.event, cb);
      });

      this.cache.delete(key);
    });
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
