import {Event} from './Event';
import {IssueEntity} from '../Type/IssueEntity';

enum EventNames {
  SelectIssue = 'SelectIssue',
  UpdateIssue = 'UpdateIssue',
  // ReadIssue = 'ReadIssue',
  MarkIssue = 'MarkIssue',
  ArchiveIssue = 'ArchiveIssue',
  ReadAllIssues = 'ReadAllIssues',
  ReadAllIssuesFromLibrary = 'ReadAllIssuesFromLibrary',
  ReadIssues = 'ReadIssues',
}

type Reason = 'read' | 'mark' | 'archive';

class _IssueEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // select issue
  emitSelectIssue(issue: IssueEntity, readBody: string) {
    this.event.emit(EventNames.SelectIssue, issue, readBody);
  }

  onSelectIssue(owner, handler: (issue: IssueEntity, readBody: string) => void) {
    return this.event.on(EventNames.SelectIssue, owner, handler);
  }

  // update issue
  emitUpdateIssue(issue: IssueEntity, oldIssue: IssueEntity, reason: Reason) {
    this.event.emit(EventNames.UpdateIssue, issue, oldIssue, reason);
  }

  onUpdateIssue(owner: any, handler: (issue: IssueEntity, oldIssue: IssueEntity, reason: Reason) => void) {
    return this.event.on(EventNames.UpdateIssue, owner, handler);
  }

  // // read issue
  // emitReadIssue(issue: IssueEntity) {
  //   this.event.emit(EventNames.ReadIssue, issue);
  // }
  //
  // onReadIssue(owner, handler: (issue: IssueEntity) => void) {
  //   return this.event.on(EventNames.ReadIssue, owner, handler);
  // }
  //
  // // mark issue
  // emitMarkIssue(issue: IssueEntity) {
  //   this.event.emit(EventNames.MarkIssue, issue);
  // }
  //
  // onMarkIssue(owner, handler: (issue: IssueEntity) => void) {
  //   return this.event.on(EventNames.MarkIssue, owner, handler);
  // }
  //
  // // archive issue
  // emitArchiveIssue(issue: IssueEntity) {
  //   this.event.emit(EventNames.ArchiveIssue, issue);
  // }
  //
  // onArchiveIssue(owner, handler: (issue: IssueEntity) => void) {
  //   return this.event.on(EventNames.ArchiveIssue, owner, handler);
  // }

  // read all
  emitReadAllIssues(streamId: number) {
    this.event.emit(EventNames.ReadAllIssues, streamId);
  }

  onReadAllIssues(owner, handler: (streamId: number) => void) {
    return this.event.on(EventNames.ReadAllIssues, owner, handler);
  }

  // // read all from library
  // emitReadAllIssuesFromLibrary(streamName: string) {
  //   this.event.emit(EventNames.ReadAllIssuesFromLibrary, streamName);
  // }
  //
  // onReadAllIssuesFromLibrary(owner, handler: (streamName: string) => void) {
  //   return this.event.on(EventNames.ReadAllIssuesFromLibrary, owner, handler);
  // }

  // read issues
  emitReadIssues(issueIds: number[]) {
    this.event.emit(EventNames.ReadIssues, issueIds);
  }

  onReadIssues(owner, handler: (issueIds: number[]) => void) {
    return this.event.on(EventNames.ReadIssues, owner, handler);
  }
}

export const IssueEvent = new _IssueEvent();
