import {Event} from './Event';
import {IssueEntity} from '../Type/IssueEntity';

const EventNames = {
  SelectStream: 'SelectStream',
  UpdateStream: 'UpdateStream',
  RestartAllStreams: 'RestartAllStreams'
};

class _StreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select stream
  emitSelectStream(stream, filteredStream = null, issue: IssueEntity = null) {
    this.event.emit(EventNames.SelectStream, stream, filteredStream, issue);
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

  // restart all streams
  emitRestartAllStreams() {
    this.event.emit(EventNames.RestartAllStreams);
  }

  onRestartAllStreams(owner, handler) {
    return this.event.on(EventNames.RestartAllStreams, owner, handler);
  }
}

export const StreamEvent = new _StreamEvent();
