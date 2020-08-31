import {BrowserWindow, ipcRenderer} from 'electron';

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

  // reload issues
  reloadIssues() {
    this.window.webContents.send(Channels.reloadIssues);
  }

  onReloadIssues(handler: () => void) {
    ipcRenderer.on(Channels.reloadIssues, handler);
  }

  // select next issue
  selectNextIssue() {
    this.window.webContents.send(Channels.selectNextIssue);
  }

  onSelectNextIssue(handler: () => void) {
    ipcRenderer.on(Channels.selectNextIssue, handler);
  }

  // select next unread issue
  selectNextUnreadIssue() {
    this.window.webContents.send(Channels.selectNextUnreadIssue);
  }

  onSelectNextUnreadIssue(handler: () => void) {
    ipcRenderer.on(Channels.selectNextUnreadIssue, handler);
  }

  // select prev issue
  selectPrevIssue() {
    this.window.webContents.send(Channels.selectPrevIssue);
  }

  onSelectPrevIssue(handler: () => void) {
    ipcRenderer.on(Channels.selectPrevIssue, handler);
  }

  // select prev unread issue
  selectPrevUnreadIssue() {
    this.window.webContents.send(Channels.selectPrevUnreadIssue);
  }

  onSelectPrevUnreadIssue(handler: () => void) {
    ipcRenderer.on(Channels.selectPrevUnreadIssue, handler);
  }

  // toggle read
  toggleRead() {
    this.window.webContents.send(Channels.toggleRead);
  }

  onToggleRead(handler: () => void) {
    ipcRenderer.on(Channels.toggleRead, handler);
  }

  // toggle mark
  toggleMark() {
    this.window.webContents.send(Channels.toggleMark);
  }

  onToggleMark(handler: () => void) {
    ipcRenderer.on(Channels.toggleMark, handler);
  }

  // toggle archive
  toggleArchive() {
    this.window.webContents.send(Channels.toggleArchive);
  }

  onToggleArchive(handler: () => void) {
    ipcRenderer.on(Channels.toggleArchive, handler);
  }

  // filter toggle unread
  filterToggleUnread() {
    this.window.webContents.send(Channels.filterToggleUnread);
  }

  onFilterToggleUnread(handler: () => void) {
    ipcRenderer.on(Channels.filterToggleUnread, handler);
  }

  // filter toggle open
  filterToggleOpen() {
    this.window.webContents.send(Channels.filterToggleOpen);
  }

  onFilterToggleOpen(handler: () => void) {
    ipcRenderer.on(Channels.filterToggleOpen, handler);
  }

  // filter toggle mark
  filterToggleMark() {
    this.window.webContents.send(Channels.filterToggleMark);
  }

  onFilterToggleMark(handler: () => void) {
    ipcRenderer.on(Channels.filterToggleMark, handler);
  }

  // filter toggle author
  filterToggleAuthor() {
    this.window.webContents.send(Channels.filterToggleAuthor);
  }

  onFilterToggleAuthor(handler: () => void) {
    ipcRenderer.on(Channels.filterToggleAuthor, handler);
  }

  // filter toggle assignee
  filterToggleAssignee() {
    this.window.webContents.send(Channels.filterToggleAssignee);
  }

  onFilterToggleAssignee(handler: () => void) {
    ipcRenderer.on(Channels.filterToggleAssignee, handler);
  }

  // focus filter
  focusFilter() {
    this.window.webContents.send(Channels.focusFilter);
  }

  onFocusFilter(handler: () => void) {
    ipcRenderer.on(Channels.focusFilter, handler);
  }

  // clear filter
  clearFilter() {
    this.window.webContents.send(Channels.clearFilter);
  }

  onClearFilter(handler: () => void) {
    ipcRenderer.on(Channels.clearFilter, handler);
  }
}

export const IssueIPC = new _IssueIPC();
