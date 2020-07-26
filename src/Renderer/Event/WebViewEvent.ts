import events from 'events';
const EVENT_NAMES = {
  SCROLL: 'scroll'
};

class _WebViewEmitter {
  private readonly _eventEmitter = new events.EventEmitter();
  private readonly _callbacks: {[k: string]: [string, (arg: any) => void]} = {};
  private _callbackId = 0;

  _addListener(eventName, callback) {
    this._eventEmitter.addListener(eventName, callback);
    this._callbacks[this._callbackId] = [eventName, callback];
    return this._callbackId++;
  }

  removeListeners(ids) {
    for (const id of ids) {
      if (this._callbacks[id]) {
        const [eventName, callback] = this._callbacks[id];
        this._eventEmitter.removeListener(eventName, callback);
      }
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

export const WebViewEvent = new _WebViewEmitter();
