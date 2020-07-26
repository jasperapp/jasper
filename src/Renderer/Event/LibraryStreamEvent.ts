import events from 'events';
import {StreamEvent} from './StreamEvent';
import {SystemStreamEvent} from './SystemStreamEvent';
import {LibraryStreamRepo} from '../Repository/LibraryStreamRepo';
import {LibraryIssue} from '../Issue/LibraryIssue';

const EVENT_NAMES = {
  SELECT_FIRST_STREAM: 'select_first_stream',
  SELECT_STREAM: 'select_stream',
  UPDATE_STREAM: 'update_stream'
};

class _LibraryStreamEmitter {
  private readonly _eventEmitter = new events.EventEmitter();
  private readonly _callbacks: {[k: string]: [string, (arg: any) => void]} = {};
  private _callbackId = 0;

  constructor() {
    StreamEvent.addUpdateStreamListener(this.emitUpdateStream.bind(this));
    SystemStreamEvent.addUpdateStreamListener(this.emitUpdateStream.bind(this));
  }

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
  async emitUpdateStream(_streamId, updatedIssueIds) {
    const streams = await LibraryStreamRepo.findAllStreams();
    for (const stream of streams) {
      const issues = await LibraryIssue.findIssuesWithFunnel(stream.name, updatedIssueIds);
      if (issues.length) console.log(`[updated] library stream: ${stream.name}, ${issues.length}`);
      if (issues.length === 0) continue;
      const ids = issues.map((issue) => issue.id);
      this._eventEmitter.emit(EVENT_NAMES.UPDATE_STREAM, stream.name, ids);
    }
  }

  addUpdateStreamListener(callback) {
    return this._addListener(EVENT_NAMES.UPDATE_STREAM, callback);
  }
}

export const LibraryStreamEvent = new _LibraryStreamEmitter();
