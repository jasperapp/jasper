import events from 'events';
const EVENT_NAMES = {
  SCROLL: 'scroll'
};

export class WebViewEmitter {
  constructor() {
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;
  }

  _addListener(eventName, callback) {
    this._eventEmitter.addListener(eventName, callback);
    this._callbacks[this._callbackId] = callback;
    return this._callbackId++;
  }

  removeListeners(ids) {
    for (const id of ids) {
      const callback = this._callbacks[id];
      if (callback) this._eventEmitter.removeListener(EVENT_NAMES.SELECT_STREAM, callback);
      delete this._callbacks[id];
    }
  }

  // scroll
  emitScroll(direction) {
    this._eventEmitter.emit(EVENT_NAMES.SCROLL, direction);
  }

  addScrollListener(callback) {
    return this._addListener(EVENT_NAMES.SCROLL, callback);
  }
}

export default new WebViewEmitter();
