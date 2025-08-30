import {BrowserWindow} from 'electron';
import {IssueChannels} from '../../IPC/Issue/Issue.channel';

class _IssueService {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  reloadIssues() {
    this.window.webContents.send(IssueChannels.reloadIssues);
  }

  selectNextIssue() {
    this.window.webContents.send(IssueChannels.selectNextIssue);
  }

  selectNextUnreadIssue() {
    this.window.webContents.send(IssueChannels.selectNextUnreadIssue);
  }

  selectPrevIssue() {
    this.window.webContents.send(IssueChannels.selectPrevIssue);
  }

  selectPrevUnreadIssue() {
    this.window.webContents.send(IssueChannels.selectPrevUnreadIssue);
  }

  toggleRead() {
    this.window.webContents.send(IssueChannels.toggleRead);
  }

  toggleMark() {
    this.window.webContents.send(IssueChannels.toggleMark);
  }

  toggleArchive() {
    this.window.webContents.send(IssueChannels.toggleArchive);
  }

  filterToggleUnread() {
    this.window.webContents.send(IssueChannels.filterToggleUnread);
  }

  filterToggleOpen() {
    this.window.webContents.send(IssueChannels.filterToggleOpen);
  }

  filterToggleMark() {
    this.window.webContents.send(IssueChannels.filterToggleMark);
  }

  filterToggleAuthor() {
    this.window.webContents.send(IssueChannels.filterToggleAuthor);
  }

  filterToggleAssignee() {
    this.window.webContents.send(IssueChannels.filterToggleAssignee);
  }

  focusFilter() {
    this.window.webContents.send(IssueChannels.focusFilter);
  }

  clearFilter() {
    this.window.webContents.send(IssueChannels.clearFilter);
  }
}

export const IssueService = new _IssueService();
