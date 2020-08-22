import {Event} from './Event';
import {IssueEntity} from '../Type/IssueEntity';
import {BaseStreamEntity} from '../Type/StreamEntity';

const EventNames = {
  SelectStream: 'SelectStream',
  SelectLibraryFirstStream: 'SelectLibraryFirstStream',
  UpdateStream: 'UpdateStream',
  RestartAllStreams: 'RestartAllStreams'
};

class _StreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select stream
  selectStream(stream: BaseStreamEntity, issue: IssueEntity = null) {
    this.event.emit(EventNames.SelectStream, stream, issue);
  }

  onSelectStream(owner: any, handler: (stream: BaseStreamEntity, issue: IssueEntity) => void) {
    this.event.on(EventNames.SelectStream, owner, handler);
  }

  // select library first stream
  selectLibraryFirstStream() {
    this.event.emit(EventNames.SelectLibraryFirstStream);
  }

  onSelectLibraryFirstStream(owner: any, handler: () => void) {
    return this.event.on(EventNames.SelectLibraryFirstStream, owner, handler);
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
