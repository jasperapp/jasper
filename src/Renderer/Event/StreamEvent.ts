import { Event } from '../Library/Infra/Event';
import { IssueEntity } from '../Library/Type/IssueEntity';
import { StreamEntity } from '../Library/Type/StreamEntity';

const EventNames = {
  SelectStream: 'SelectStream',
  UpdateStreamIssues: 'UpdateStreamIssues',
  ReloadAllStreams: 'ReloadAllStreams',
  CreateFilterStream: 'CreateFilterStream',
  FinishFirstSearching: 'FinishFirstSearching',
};

class _StreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select stream
  async emitSelectStream(stream: StreamEntity, issue: IssueEntity = null, noEmitSelectIssue = false) {
    console.error(`StreamEvent.emitSelectStream(): ${stream.name} ${issue?.title} ${noEmitSelectIssue}`);
    return this.event.emit(EventNames.SelectStream, stream, issue, noEmitSelectIssue);
  }

  onSelectStream(owner: any, handler: (stream: StreamEntity, issue: IssueEntity, noEmitSelectIssue: boolean) => void) {
    this.event.on(EventNames.SelectStream, owner, handler);
  }

  // update stream issues
  emitUpdateStreamIssues(streamId: number, updatedIssueIds: number[]) {
    this.event.emit(EventNames.UpdateStreamIssues, streamId, updatedIssueIds);
  }

  onUpdateStreamIssues(owner: any, handler: (streamId: number, updatedIssueIds: number[]) => void) {
    return this.event.on(EventNames.UpdateStreamIssues, owner, handler);
  }

  // reload all streams
  emitReloadAllStreams() {
    this.event.emit(EventNames.ReloadAllStreams);
  }

  onReloadAllStreams(owner, handler: () => void) {
    return this.event.on(EventNames.ReloadAllStreams, owner, handler);
  }

  // create filter stream
  emitCreateFilterStream(streamId: number, filter: string) {
    this.event.emit(EventNames.CreateFilterStream, streamId, filter);
  }

  onCreateFilterStream(owner, handler: (streamId: number, filter: string) => void) {
    return this.event.on(EventNames.CreateFilterStream, owner, handler);
  }

  // finish first searching
  emitFinishFirstSearching(streamId: number) {
    this.event.emit(EventNames.FinishFirstSearching, streamId);
  }

  onFinishFirstSearching(owner, handler: (streamId: number) => void) {
    return this.event.on(EventNames.FinishFirstSearching, owner, handler);
  }
}

export const StreamEvent = new _StreamEvent();
