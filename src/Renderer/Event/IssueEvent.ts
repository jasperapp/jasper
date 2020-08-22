import {Event} from '../Library/Infra/Event';
import {IssueEntity} from '../Library/Type/IssueEntity';

enum EventNames {
  SelectIssue = 'SelectIssue',
  UpdateIssues = 'UpdateIssues',
  ReadAllIssues = 'ReadAllIssues',
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

  // update issues
  emitUpdateIssues(issues: IssueEntity[], oldIssues: IssueEntity[], reason: Reason) {
    this.event.emit(EventNames.UpdateIssues, issues, oldIssues, reason);
  }

  onUpdateIssues(owner: any, handler: (issues: IssueEntity[], oldIssues: IssueEntity[], reason: Reason) => void) {
    return this.event.on(EventNames.UpdateIssues, owner, handler);
  }

  // read all
  emitReadAllIssues(streamId: number) {
    this.event.emit(EventNames.ReadAllIssues, streamId);
  }

  onReadAllIssues(owner, handler: (streamId: number) => void) {
    return this.event.on(EventNames.ReadAllIssues, owner, handler);
  }
}

export const IssueEvent = new _IssueEvent();
