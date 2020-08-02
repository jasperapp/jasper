import {StreamEvent} from './StreamEvent';
import {SystemStreamEvent} from './SystemStreamEvent';
import {LibraryStreamRepo} from '../Repository/LibraryStreamRepo';
import {Event} from './Event';
import {IssueRepo} from '../Repository/IssueRepo';

enum EventNames {
  SelectFirstStream = 'SelectFirstStream',
  SelectStream = 'SelectStream',
  UpdateStream = 'UpdateStream',
}

class _LibraryStreamEvent {
  private readonly event = new Event();

  constructor() {
    StreamEvent.onUpdateStream(this, this.emitUpdateStream.bind(this));
    SystemStreamEvent.onUpdateStream(this, this.emitUpdateStream.bind(this));
  }

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select first stream
  emitSelectFirstStream() {
    this.event.emit(EventNames.SelectFirstStream);
  }

  onSelectFirstStream(owner, handler) {
    return this.event.on(EventNames.SelectFirstStream, owner, handler);
  }

  // select stream
  emitSelectStream(streamName) {
    this.event.emit(EventNames.SelectStream, streamName);
  }

  onSelectStream(owner, callback) {
    return this.event.on(EventNames.SelectStream, owner, callback);
  }

  // update stream
  async emitUpdateStream(_streamId, updatedIssueIds) {
    const {error, libraryStreams} = await LibraryStreamRepo.getAllLibraryStreams();
    if (error) return console.error(error);

    for (const stream of libraryStreams) {
      const {error, issueIds} = await IssueRepo.getIncludeIds(updatedIssueIds, null, stream.defaultFilter);
      if (error) return console.error(error);
      if (!issueIds.length) continue;
      await this.event.emit(EventNames.UpdateStream, stream.name, issueIds);
    }
  }

  onUpdateStream(owner, handler) {
    return this.event.on(EventNames.UpdateStream, owner, handler);
  }
}

export const LibraryStreamEvent = new _LibraryStreamEvent();
