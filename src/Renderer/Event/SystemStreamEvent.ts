import {Event} from './Event';
import {IssueEntity} from '../Type/IssueEntity';

enum EventNames {
  SelectStream = 'SelectStream',
  UpdateStream = 'UpdateStream',
  OpenStreamSetting = 'OpenStreamSetting',
  CloseStreamSetting = 'CloseStreamSetting',
  OpenSubscriptionSetting = 'OpenSubscriptionSetting',
  CloseSubscriptionSetting = 'CloseSubscriptionSetting',
  RestartAllStreams = 'RestartAllStreams',
}

class _SystemStreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select stream
  emitSelectStream(stream, issue: IssueEntity = null) {
    this.event.emit(EventNames.SelectStream, stream, issue);
  }

  onSelectStream(owner, callback) {
    return this.event.on(EventNames.SelectStream, owner, callback);
  }

  // update stream
  emitUpdateStream(streamId: number, updatedIssueIds: number[]) {
    if (streamId < 0) {
      this.event.emit(EventNames.UpdateStream, streamId, updatedIssueIds);
    }
  }
  onUpdateStream(owner, handler: (streamId: number, updatedIssueIds: number[]) => void) {
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

  // open subscription setting
  emitOpenSubscriptionSetting() {
    this.event.emit(EventNames.OpenSubscriptionSetting);
  }

  OpenSubscriptionSetting(owner, handler) {
    return this.event.on(EventNames.OpenSubscriptionSetting, owner, handler);
  }

  // close subscription setting
  emitCloseSubscriptionSetting() {
    this.event.emit(EventNames.CloseSubscriptionSetting);
  }

  onCloseSubscriptionSetting(owner, handler) {
    return this.event.on(EventNames.CloseSubscriptionSetting, owner, handler);
  }

  // restart all streams
  emitRestartAllStreams() {
    this.event.emit(EventNames.RestartAllStreams);
  }

  onRestartAllStreams(owner, handler) {
    return this.event.on(EventNames.RestartAllStreams, owner, handler);
  }
}

export const SystemStreamEvent = new _SystemStreamEvent();
