import {Event} from './Event';

enum EventNames {
  UpdateStream = 'UpdateStream',
  RestartAllStreams = 'RestartAllStreams',
}

class _SystemStreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
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
