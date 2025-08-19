function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}


class EventListenerTracker {
  constructor() {
    this.cache = [];
  }

  /**
   * Adds an event listener to the specified target.
   * @param {string} event - The event type.
   * @param {EventTarget} target - The target to add the listener to.
   * @param {Function} callback - The event handler function.
   */
  add(event, target, callback) {
    target.addEventListener(event, callback);
    this.cache.push({ event, target, callback });
  }

  /**
   * Removes an event listener from the specified target.
   * @param {string} event - The event type.
   * @param {EventTarget} target - The target to remove the listener from.
   * @param {Function} callback - The event handler function to remove.
   */
  remove(event, target, callback) {
    target.removeEventListener(event, callback);
    this.cache = this.cache.filter((listener) => {
      return listener.event !== event || listener.target !== target || listener.callback !== callback;
    });
  }

  /**
   * Clears event listeners from the cache. Optionally only clear listeners for
   * a specific target and/or event type.
   * @param {EventTarget} options.target - The target to clear listeners from.
   * @param {string} options.event - The event type to clear listeners for.
   */
  clear(options = {}) {
    this.cache = this.cache.filter((listener) => {
      if (options.event && listener.event !== options.event) return true;
      if (options.target && listener.target !== options.target) return true;
      listener.target.removeEventListener(listener.event, listener.callback);
      return false;
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
