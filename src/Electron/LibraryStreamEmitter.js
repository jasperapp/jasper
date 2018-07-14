import events from 'events';
import electron from 'electron';
import StreamEmitter from './StreamEmitter';
import SystemStreamEmitter from './SystemStreamEmitter';
import LibraryStreamCenter from './LibraryStreamCenter';
import LibraryIssueCenter from './Issue/LibraryIssue';

const Logger = electron.remote.require('color-logger').default;

const EVENT_NAMES = {
  SELECT_FIRST_STREAM: 'select_first_stream',
  SELECT_STREAM: 'select_stream',
  UPDATE_STREAM: 'update_stream'
};

export class LibraryStreamEmitter {
  constructor() {
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;

    StreamEmitter.addUpdateStreamListener(this.emitUpdateStream.bind(this));
    SystemStreamEmitter.addUpdateStreamListener(this.emitUpdateStream.bind(this));
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

  // select first stream
  emitSelectFirstStream() {
    this._eventEmitter.emit(EVENT_NAMES.SELECT_FIRST_STREAM);
  }

  addSelectFirstStreamListener(callback) {
    return this._addListener(EVENT_NAMES.SELECT_FIRST_STREAM, callback);
  }

  // select stream
  emitSelectStream(streamName) {
    this._eventEmitter.emit(EVENT_NAMES.SELECT_STREAM, streamName);
  }

  addSelectStreamListener(callback) {
    return this._addListener(EVENT_NAMES.SELECT_STREAM, callback);
  }

  // update stream
  async emitUpdateStream(streamId, updatedIssueIds) {
    const streams = await LibraryStreamCenter.findAllStreams();
    for (const stream of streams) {
      const issues = await LibraryIssueCenter.findIssuesWithFunnel(stream.name, updatedIssueIds);
      Logger.n(`[updated] library stream: ${stream.name}, ${issues.length}`);
      if (issues.length === 0) continue;
      const ids = issues.map((issue) => issue.id);
      this._eventEmitter.emit(EVENT_NAMES.UPDATE_STREAM, stream.name, ids);
    }
  }

  addUpdateStreamListener(callback) {
    return this._addListener(EVENT_NAMES.UPDATE_STREAM, callback);
  }
}

export default new LibraryStreamEmitter();
