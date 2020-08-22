// import {StreamEvent} from './StreamEvent';
// import {SystemStreamEvent} from './SystemStreamEvent';
// import {LibraryStreamRepo} from '../Repository/LibraryStreamRepo';
// import {Event} from './Event';
// import {IssueRepo} from '../Repository/IssueRepo';
//
// enum EventNames {
//   UpdateStream = 'UpdateStream',
// }
//
// class _LibraryStreamEvent {
//   private readonly event = new Event();
//
//   // constructor() {
//   //   StreamEvent.onUpdateStreamIssues(this, this.emitUpdateStream.bind(this));
//   //   SystemStreamEvent.onUpdateStream(this, this.emitUpdateStream.bind(this));
//   // }
//
//   offAll(owner) {
//     this.event.offAll(owner);
//   }
//
//   // update stream
//   // async emitUpdateStream(_streamId, updatedIssueIds) {
//   //   const {error, libraryStreams} = await LibraryStreamRepo.getAllLibraryStreams();
//   //   if (error) return console.error(error);
//   //
//   //   for (const stream of libraryStreams) {
//   //     const {error, issueIds} = await IssueRepo.getIncludeIds(updatedIssueIds, null, stream.defaultFilter);
//   //     if (error) return console.error(error);
//   //     if (!issueIds.length) continue;
//   //     await this.event.emit(EventNames.UpdateStreamIssues, stream.name, issueIds);
//   //   }
//   // }
//   //
//   // onUpdateStream(owner, handler) {
//   //   return this.event.on(EventNames.UpdateStreamIssues, owner, handler);
//   // }
// }
//
// export const LibraryStreamEvent = new _LibraryStreamEvent();
