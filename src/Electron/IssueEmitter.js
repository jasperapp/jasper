import events from 'events';

const EVENT_NAMES = {
  SELECT_ISSUE: 'select_issue',
  FOCUS_ISSUE: 'focus_issue',
  READ_ISSUE: 'read_issue',
  MARK_ISSUE: 'mark_issue',
  ARCHIVE_ISSUE: 'archive_issue',
  READ_ALL_ISSUES: 'read_all_issues',
  READ_ALL_ISSUES_FROM_LIBRARY: 'read_all_issues_from_library',
  READ_ISSUES: 'read_issues'
};

export class IssueEmitter {
  constructor() {
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;
  }

  _addListener(eventName, callback) {
    this._eventEmitter.addListener(eventName, callback);
    this._callbacks[this._callbackId] = callback;
    return this._callbackId++;
  }

  removeListeners(ids) {
    for (const id of ids) {
      const callback = this._callbacks[id];
      if (callback) this._eventEmitter.removeListener(EVENT_NAMES.SELECT_STREAM, callback);
      delete this._callbacks[id];
    }
  }

  // select issue
  emitSelectIssue(issue, readBody) {
    this._eventEmitter.emit(EVENT_NAMES.SELECT_ISSUE, issue, readBody);
  }

  addSelectIssueListener(callback) {
    return this._addListener(EVENT_NAMES.SELECT_ISSUE, callback);
  }

  // focus issue
  emitFocusIssue(issue) {
    this._eventEmitter.emit(EVENT_NAMES.FOCUS_ISSUE, issue);
  }

  addFocusIssueListener(callback) {
    return this._addListener(EVENT_NAMES.FOCUS_ISSUE, callback);
  }

  // read issue
  emitReadIssue(issue) {
    this._eventEmitter.emit(EVENT_NAMES.READ_ISSUE, issue);
  }

  addReadIssueListener(callback) {
    return this._addListener(EVENT_NAMES.READ_ISSUE, callback);
  }

  // mark issue
  emitMarkIssue(issue) {
    this._eventEmitter.emit(EVENT_NAMES.MARK_ISSUE, issue);
  }

  addMarkIssueListener(callback) {
    return this._addListener(EVENT_NAMES.MARK_ISSUE, callback);
  }

  // archive issue
  emitArchiveIssue(issue) {
    this._eventEmitter.emit(EVENT_NAMES.ARCHIVE_ISSUE, issue);
  }

  addArchiveIssueListener(callback) {
    return this._addListener(EVENT_NAMES.ARCHIVE_ISSUE, callback);
  }

  // read all
  emitReadAllIssues(streamId) {
    this._eventEmitter.emit(EVENT_NAMES.READ_ALL_ISSUES, streamId);
  }

  addReadAllIssuesListener(callback) {
    return this._addListener(EVENT_NAMES.READ_ALL_ISSUES, callback);
  }

  // read all from library
  emitReadAllIssuesFromLibrary(streamName) {
    this._eventEmitter.emit(EVENT_NAMES.READ_ALL_ISSUES_FROM_LIBRARY, streamName);
  }

  addReadAllIssuesFromLibraryListener(callback) {
    return this._addListener(EVENT_NAMES.READ_ALL_ISSUES_FROM_LIBRARY, callback);
  }

  // read issues
  emitReadIssues(issueIds) {
    this._eventEmitter.emit(EVENT_NAMES.READ_ISSUES, issueIds);
  }

  addReadIssuesListener(callback) {
    return this._addListener(EVENT_NAMES.READ_ISSUES, callback);
  }
}

export default new IssueEmitter();
