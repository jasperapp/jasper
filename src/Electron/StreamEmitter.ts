import events from 'events';
import {RemoteStreamEmitter} from './Remote';

const EVENT_NAMES = {
  SELECT_STREAM: 'select_stream',
  UPDATE_STREAM: 'update_stream',
  OPEN_STREAM_SETTING: 'open_stream_setting',
  CLOSE_STREAM_SETTING: 'close_stream_setting',
  OPEN_FILTERED_STREAM_SETTING: 'open_filtered_stream_setting',
  CLOSE_FILTERED_STREAM_SETTING: 'close_filtered_stream_setting',
  RESTART_ALL_STREAMS: 'restart_all_streams'
};

export class StreamEmitter {
  private readonly _eventEmitter = new events.EventEmitter();
  private readonly _callbacks: {[k: string]: [string, (arg: any) => void]} = {};
  private _callbackId = 0;

  constructor() {
    // hack: remoteを監視すると、メモリリークのおそれがある（例えば画面をリロードしたとき）
    RemoteStreamEmitter.addUpdateStreamListener(this.emitUpdateStream.bind(this));
    RemoteStreamEmitter.addRestartAllStreamsListener(this.emitRestartAllStreams.bind(this));
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

  // select stream
  emitSelectStream(stream, filteredStream = null) {
    this._eventEmitter.emit(EVENT_NAMES.SELECT_STREAM, stream, filteredStream);
  }

  addSelectStreamListener(callback) {
    return this._addListener(EVENT_NAMES.SELECT_STREAM, callback);
  }

  // update stream
  emitUpdateStream(streamId, updatedIssueIds) {
    if (streamId >= 0) {
      this._eventEmitter.emit(EVENT_NAMES.UPDATE_STREAM, streamId, updatedIssueIds);
    }
  }

  addUpdateStreamListener(callback) {
    return this._addListener(EVENT_NAMES.UPDATE_STREAM, callback);
  }

  // open stream setting
  emitOpenStreamSetting(stream = null) {
    this._eventEmitter.emit(EVENT_NAMES.OPEN_STREAM_SETTING, stream);
  }

  addOpenStreamSettingListener(callback) {
    return this._addListener(EVENT_NAMES.OPEN_STREAM_SETTING, callback);
  }

  // close stream setting
  emitCloseStreamSetting(stream = null) {
    this._eventEmitter.emit(EVENT_NAMES.CLOSE_STREAM_SETTING, stream);
  }

  addCloseStreamSettingListener(callback) {
    return this._addListener(EVENT_NAMES.CLOSE_STREAM_SETTING, callback);
  }

  // open filtered stream setting
  emitOpenFilteredStreamSetting(stream, filter = null, filteredStream = null) {
    this._eventEmitter.emit(EVENT_NAMES.OPEN_FILTERED_STREAM_SETTING, stream, filter, filteredStream);
  }

  addOpenFilteredStreamSettingListener(callback) {
    return this._addListener(EVENT_NAMES.OPEN_FILTERED_STREAM_SETTING, callback);
  }

  // close filtered stream setting
  emitCloseFilteredStreamSetting(stream = null) {
    this._eventEmitter.emit(EVENT_NAMES.CLOSE_FILTERED_STREAM_SETTING, stream);
  }

  addCloseFilteredStreamSettingListener(callback) {
    return this._addListener(EVENT_NAMES.CLOSE_FILTERED_STREAM_SETTING, callback);
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
