import { BrowserWindow, ipcRenderer } from 'electron';

enum Channels2 {
  // issue
  reloadIssues = 'IssueIPC:reloadIssues',
  selectNextIssue = 'IssueIPC:selectNextIssue',
  selectNextUnreadIssue = 'IssueIPC:selectNextUnreadIssue',
  selectPrevIssue = 'IssueIPC:selectPrevIssue',
  selectPrevUnreadIssue = 'IssueIPC:selectPrevUnreadIssue',
  toggleRead = 'IssueIPC:toggleRead',
  toggleMark = 'IssueIPC:toggleMark',
  filterToggleAssignee = 'IssueIPC:filterToggleAssignee',
  filterToggleAuthor = 'IssueIPC:filterToggleAuthor',
  filterToggleMark = 'IssueIPC:filterToggleMark',
  filterToggleOpen = 'IssueIPC:filterToggleOpen',
  filterToggleUnread = 'IssueIPC:filterToggleUnread'
}

class _IssueIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  private sendMessage(channel: Channels) {
    this.window.webContents.send(channel);
  }

  private onMessage(channel: Channels, handler: () => void) {
    ipcRenderer.on(channel, handler);
  }

  // reload issues
  reloadIssues() {
    this.sendMessage(Channels.reloadIssues);
  }

  onReloadIssues(handler: () => void) {
    this.onMessage(Channels.reloadIssues, handler);
  }

  // select next issue
  selectNextIssue() {
    this.sendMessage(Channels.selectNextIssue);
  }

  onSelectNextIssue(handler: () => void) {
    this.onMessage(Channels.selectNextIssue, handler);
  }

  // select next unread issue
  selectNextUnreadIssue() {
    this.sendMessage(Channels.selectNextUnreadIssue);
  }

  onSelectNextUnreadIssue(handler: () => void) {
    this.onMessage(Channels.selectNextUnreadIssue, handler);
  }

  // select prev issue
  selectPrevIssue() {
    this.sendMessage(Channels.selectPrevIssue);
  }

  onSelectPrevIssue(handler: () => void) {
    this.onMessage(Channels.selectPrevIssue, handler);
  }

  // select prev unread issue
  selectPrevUnreadIssue() {
    this.sendMessage(Channels.selectPrevUnreadIssue);
  }

  onSelectPrevUnreadIssue(handler: () => void) {
    this.onMessage(Channels.selectPrevUnreadIssue, handler);
  }

  // toggle read
  toggleRead() {
    this.sendMessage(Channels.toggleRead);
  }

  onToggleRead(handler: () => void) {
    this.onMessage(Channels.toggleRead, handler);
  }

  // toggle mark
  toggleMark() {
    this.sendMessage(Channels.toggleMark);
  }

  onToggleMark(handler: () => void) {
    this.onMessage(Channels.toggleMark, handler);
  }

  // toggle archive
  toggleArchive() {
    this.sendMessage(Channels.toggleArchive);
  }

  onToggleArchive(handler: () => void) {
    this.onMessage(Channels.toggleArchive, handler);
  }

  // filter toggle unread
  filterToggleUnread() {
    this.sendMessage(Channels.filterToggleUnread);
  }

  onFilterToggleUnread(handler: () => void) {
    this.onMessage(Channels.filterToggleUnread, handler);
  }

  // filter toggle open
  filterToggleOpen() {
    this.sendMessage(Channels.filterToggleOpen);
  }

  onFilterToggleOpen(handler: () => void) {
    this.onMessage(Channels.filterToggleOpen, handler);
  }

  // filter toggle mark
  filterToggleMark() {
    this.sendMessage(Channels.filterToggleMark);
  }

  onFilterToggleMark(handler: () => void) {
    this.onMessage(Channels.filterToggleMark, handler);
  }

  // filter toggle author
  filterToggleAuthor() {
    this.sendMessage(Channels.filterToggleAuthor);
  }

  onFilterToggleAuthor(handler: () => void) {
    this.onMessage(Channels.filterToggleAuthor, handler);
  }

  // filter toggle assignee
  filterToggleAssignee() {
    this.sendMessage(Channels.filterToggleAssignee);
  }

  onFilterToggleAssignee(handler: () => void) {
    this.onMessage(Channels.filterToggleAssignee, handler);
  }

  // focus filter
  focusFilter() {
    this.sendMessage(Channels.focusFilter);
  }

  onFocusFilter(handler: () => void) {
    this.onMessage(Channels.focusFilter, handler);
  }

  // clear filter
  clearFilter() {
    this.sendMessage(Channels.clearFilter);
  }

  onClearFilter(handler: () => void) {
    this.onMessage(Channels.clearFilter, handler);
  }
}

export const IssueIPC = new _IssueIPC();


import { BrowserWindow, ipcRenderer } from 'electron';

enum Channels {
  // issue
  reloadIssues = 'IssueIPC:reloadIssues',
  selectNextIssue = 'IssueIPC:selectNextIssue',
  selectNextUnreadIssue = 'IssueIPC:selectNextUnreadIssue',
  selectPrevIssue = 'IssueIPC:selectPrevIssue',
  selectPrevUnreadIssue = 'IssueIPC:selectPrevUnreadIssue',
  toggleRead = 'IssueIPC:toggleRead',
  toggleMark = 'IssueIPC:toggleMark',
  toggleArchive = 'IssueIPC:toggleArchive',
  filterToggleUnread = 'IssueIPC:filterToggleUnread',
  filterToggleOpen = 'IssueIPC:filterToggleOpen',
  filterToggleMark = 'IssueIPC:filterToggleMark',
  filterToggleAuthor = 'IssueIPC:filterToggleAuthor',
  filterToggleAssignee = 'IssueIPC:filterToggleAssignee',
  focusFilter = 'IssueIPC:focusFilter',
  clearFilter = 'IssueIPC:clearFilter',
}

class _IssueIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  private sendMessage(channel: Channels) {
    this.window.webContents.send(channel);
  }

  private onMessage(channel: Channels, handler: () => void) {
    ipcRenderer.on(channel, handler);
  }

  // reload issues
  reloadIssues() {
    this.sendMessage(Channels.reloadIssues);
  }

  onReloadIssues(handler: () => void) {
    this.onMessage(Channels.reloadIssues, handler);
  }

  // Add other methods similarly using sendMessage and onMessage
}