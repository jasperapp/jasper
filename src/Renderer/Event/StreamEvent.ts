import {Event} from './Event';

const EventNames = {
  SelectStream: 'SelectStream',
  UpdateStream: 'UpdateStream',
  OpenStreamSetting: 'OpenStreamSetting',
  CloseStreamSetting: 'CloseStreamSetting',
  OpenFilteredStreamSetting: 'OpenFilteredStreamSetting',
  CloseFilteredStreamSetting: 'CloseFilteredStreamSetting',
  RestartAllStreams: 'RestartAllStreams'
};

class _StreamEmitter {
  // private readonly _eventEmitter = new events.EventEmitter();
  // private readonly _callbacks: {[k: string]: [string, (arg: any) => void]} = {};
  // private _callbackId = 0;
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // constructor() {
  //   // hack: remoteを監視すると、メモリリークのおそれがある（例えば画面をリロードしたとき）
  //   // RemoteStreamEmitter.addUpdateStreamListener(this.emitUpdateStream.bind(this));
  //   // RemoteStreamEmitter.addRestartAllStreamsListener(this.emitRestartAllStreams.bind(this));
  // }

  // _addListener(eventName, callback) {
  //   this._eventEmitter.addListener(eventName, callback);
  //   this._callbacks[this._callbackId] = [eventName, callback];
  //   return this._callbackId++;
  // }
  //
  // removeListeners(ids) {
  //   for (const id of ids) {
  //     if (this._callbacks[id]) {
  //       const [eventName, callback] = this._callbacks[id];
  //       this._eventEmitter.removeListener(eventName, callback);
  //     }
  //     delete this._callbacks[id];
  //   }
  // }

  // select stream
  emitSelectStream(stream, filteredStream = null) {
    this.event.emit(EventNames.SelectStream, stream, filteredStream);
  }

  onSelectStream(owner, handler) {
    return this.event.on(EventNames.SelectStream, owner, handler);
  }

  // update stream
  emitUpdateStream(streamId, updatedIssueIds) {
    if (streamId >= 0) {
      this.event.emit(EventNames.UpdateStream, streamId, updatedIssueIds);
    }
  }

  onUpdateStream(owner, handler) {
    return this.event.on(EventNames.UpdateStream, owner, handler);
  }

  // open stream setting
  emitOpenStreamSetting(stream = null) {
    this.event.emit(EventNames.OpenStreamSetting, stream);
  }

  onOpenStreamSetting(owner, handler) {
    return this.event.on(EventNames.OpenStreamSetting, owner, handler);
  }

  // close stream setting
  emitCloseStreamSetting(stream = null) {
    this.event.emit(EventNames.CloseStreamSetting, stream);
  }

  onCloseStreamSetting(owner, handler) {
    return this.event.on(EventNames.CloseStreamSetting, owner, handler);
  }

  // open filtered stream setting
  emitOpenFilteredStreamSetting(stream, filter = null, filteredStream = null) {
    this.event.emit(EventNames.OpenFilteredStreamSetting, stream, filter, filteredStream);
  }

  onOpenFilteredStreamSetting(owner, handler) {
    return this.event.on(EventNames.OpenFilteredStreamSetting, owner, handler);
  }

  // close filtered stream setting
  emitCloseFilteredStreamSetting(stream = null) {
    this.event.emit(EventNames.CloseFilteredStreamSetting, stream);
  }

  onCloseFilteredStreamSetting(owner, handler) {
    return this.event.on(EventNames.CloseFilteredStreamSetting, owner, handler);
  }

  // restart all streams
  emitRestartAllStreams() {
    this.event.emit(EventNames.RestartAllStreams);
  }

  onRestartAllStreams(owner, handler) {
    return this.event.on(EventNames.RestartAllStreams, owner, handler);
  }
}

export const StreamEvent = new _StreamEmitter();
