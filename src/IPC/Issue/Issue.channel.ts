export enum IssueChannels {
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

// class _IssueIPC {
//   private window: BrowserWindow;
//
//   initWindow(window: BrowserWindow) {
//     this.window = window;
//   }
//
//   // reload issues
//   reloadIssues() {
//     this.window.webContents.send(IssueChannels.reloadIssues);
//   }
//
//   onReloadIssues(handler: () => void) {
//     ipcRenderer.on(IssueChannels.reloadIssues, handler);
//   }
//
//   // select next issue
//   selectNextIssue() {
//     this.window.webContents.send(IssueChannels.selectNextIssue);
//   }
//
//   onSelectNextIssue(handler: () => void) {
//     ipcRenderer.on(IssueChannels.selectNextIssue, handler);
//   }
//
//   // select next unread issue
//   selectNextUnreadIssue() {
//     this.window.webContents.send(IssueChannels.selectNextUnreadIssue);
//   }
//
//   onSelectNextUnreadIssue(handler: () => void) {
//     ipcRenderer.on(IssueChannels.selectNextUnreadIssue, handler);
//   }
//
//   // select prev issue
//   selectPrevIssue() {
//     this.window.webContents.send(IssueChannels.selectPrevIssue);
//   }
//
//   onSelectPrevIssue(handler: () => void) {
//     ipcRenderer.on(IssueChannels.selectPrevIssue, handler);
//   }
//
//   // select prev unread issue
//   selectPrevUnreadIssue() {
//     this.window.webContents.send(IssueChannels.selectPrevUnreadIssue);
//   }
//
//   onSelectPrevUnreadIssue(handler: () => void) {
//     ipcRenderer.on(IssueChannels.selectPrevUnreadIssue, handler);
//   }
//
//   // toggle read
//   toggleRead() {
//     this.window.webContents.send(IssueChannels.toggleRead);
//   }
//
//   onToggleRead(handler: () => void) {
//     ipcRenderer.on(IssueChannels.toggleRead, handler);
//   }
//
//   // toggle mark
//   toggleMark() {
//     this.window.webContents.send(IssueChannels.toggleMark);
//   }
//
//   onToggleMark(handler: () => void) {
//     ipcRenderer.on(IssueChannels.toggleMark, handler);
//   }
//
//   // toggle archive
//   toggleArchive() {
//     this.window.webContents.send(IssueChannels.toggleArchive);
//   }
//
//   onToggleArchive(handler: () => void) {
//     ipcRenderer.on(IssueChannels.toggleArchive, handler);
//   }
//
//   // filter toggle unread
//   filterToggleUnread() {
//     this.window.webContents.send(IssueChannels.filterToggleUnread);
//   }
//
//   onFilterToggleUnread(handler: () => void) {
//     ipcRenderer.on(IssueChannels.filterToggleUnread, handler);
//   }
//
//   // filter toggle open
//   filterToggleOpen() {
//     this.window.webContents.send(IssueChannels.filterToggleOpen);
//   }
//
//   onFilterToggleOpen(handler: () => void) {
//     ipcRenderer.on(IssueChannels.filterToggleOpen, handler);
//   }
//
//   // filter toggle mark
//   filterToggleMark() {
//     this.window.webContents.send(IssueChannels.filterToggleMark);
//   }
//
//   onFilterToggleMark(handler: () => void) {
//     ipcRenderer.on(IssueChannels.filterToggleMark, handler);
//   }
//
//   // filter toggle author
//   filterToggleAuthor() {
//     this.window.webContents.send(IssueChannels.filterToggleAuthor);
//   }
//
//   onFilterToggleAuthor(handler: () => void) {
//     ipcRenderer.on(IssueChannels.filterToggleAuthor, handler);
//   }
//
//   // filter toggle assignee
//   filterToggleAssignee() {
//     this.window.webContents.send(IssueChannels.filterToggleAssignee);
//   }
//
//   onFilterToggleAssignee(handler: () => void) {
//     ipcRenderer.on(IssueChannels.filterToggleAssignee, handler);
//   }
//
//   // focus filter
//   focusFilter() {
//     this.window.webContents.send(IssueChannels.focusFilter);
//   }
//
//   onFocusFilter(handler: () => void) {
//     ipcRenderer.on(IssueChannels.focusFilter, handler);
//   }
//
//   // clear filter
//   clearFilter() {
//     this.window.webContents.send(IssueChannels.clearFilter);
//   }
//
//   onClearFilter(handler: () => void) {
//     ipcRenderer.on(IssueChannels.clearFilter, handler);
//   }
// }
//
// export const IssueIPC = new _IssueIPC();
