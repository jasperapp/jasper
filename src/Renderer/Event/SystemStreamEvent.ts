import {Event} from './Event';
import {IssueEntity} from '../Type/IssueEntity';

enum EventNames {
  SelectStream = 'SelectStream',
  UpdateStream = 'UpdateStream',
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

  // restart all streams
  emitRestartAllStreams() {
    this.event.emit(EventNames.RestartAllStreams);
  }

  onRestartAllStreams(owner, handler) {
    return this.event.on(EventNames.RestartAllStreams, owner, handler);
  }
}

export const SystemStreamEvent = new _SystemStreamEvent();
