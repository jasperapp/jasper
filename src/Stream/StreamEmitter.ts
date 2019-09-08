import events from 'events';

const EVENT_NAMES = {
  UPDATE_STREAM: 'update_stream',
  RESTART_ALL_STREAMS: 'restart_all_streams'
};

export class StreamEmitter {
  private _eventEmitter: events.EventEmitter;
  private readonly _callbacks: {[key: number]: [string, () => void]};
  private _callbackId: number;

  constructor() {
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;
  }

  _addListener(eventName, callback) {
    this._eventEmitter.addListener(eventName, callback);
    this._callbacks[this._callbackId] = [eventName, callback];
    return this._callbackId++;
  }

  removeListeners(ids) {
    for (const id of ids) {
      if (this._callbackId[id]) {
        const [eventName, callback] = this._callbacks[id];
        this._eventEmitter.removeListener(eventName, callback);
      }
      delete this._callbacks[id];
    }
  }

  // update
  emitUpdateStream(streamId, issueIds) {
    this._eventEmitter.emit(EVENT_NAMES.UPDATE_STREAM, streamId, issueIds);
  }

  addUpdateStreamListener(callback) {
    return this._addListener(EVENT_NAMES.UPDATE_STREAM, callback);
  }

  // restart all streams
  emitRestartAllStreams() {
    this._eventEmitter.emit(EVENT_NAMES.RESTART_ALL_STREAMS);
  }

  addRestartAllStreamsListener(callback) {
    return this._addListener(EVENT_NAMES.RESTART_ALL_STREAMS, callback);
  }
}

export default new StreamEmitter();
