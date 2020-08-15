import {BrowserWindow, ipcRenderer} from 'electron';

enum Channels {
  reloadIssues = 'CommandIPC:reloadIssues',
  selectNextIssue = 'CommandIPC:selectNextIssue',
  selectNextUnreadIssue = 'CommandIPC:selectNextUnreadIssue',
  selectPrevIssue = 'CommandIPC:selectPrevIssue',
  selectPrevUnreadIssue = 'CommandIPC:selectPrevUnreadIssue',
  toggleRead = 'CommandIPC:toggleRead',
  toggleMark = 'CommandIPC:toggleMark',
  toggleArchive = 'CommandIPC:toggleArchive',
  filterToggleUnread = 'CommandIPC:filterToggleUnread',
  filterToggleOpen = 'CommandIPC:filterToggleOpen',
  filterToggleMark = 'CommandIPC:filterToggleMark',
  filterToggleAuthor = 'CommandIPC:filterToggleAuthor',
  filterToggleAssignee = 'CommandIPC:filterToggleAssignee',
  focusFilter = 'CommandIPC:focusFilter',
  clearFilter = 'CommandIPC:clearFilter',
  openIssueWithExternalBrowser = 'CommandIPC:openIssueWithExternalBrowser',
}

class _CommandIPC {
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

  // open issue url with external browser
  openIssueURLWithExternalBrowser() {
    this.window.webContents.send(Channels.openIssueWithExternalBrowser);
  }

  onOpenIssueWithExternalBrowser(handler: () => void) {
    ipcRenderer.on(Channels.openIssueWithExternalBrowser, handler);
  }
}

export const CommandIPC = new _CommandIPC();
