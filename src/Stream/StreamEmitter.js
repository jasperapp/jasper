import events from 'events';

const EVENT_NAMES = {
  UPDATE_STREAM: 'update_stream',
  RESTART_ALL_STREAMS: 'restart_all_streams'
};

export class StreamEmitter {
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
