import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  stopAllStreams = 'StreamIPC:stopAllStream',
  restartAllStreams = 'StreamIPC:restartAllStreams',
  unreadCount = 'StreamIPC:unreadCount',
  exportStreams = 'StreamIPC:exportStreams',
  importStreams = 'StreamIPC:importStreams',

  selectNextStream = 'StreamIPC:selectNextStream',
  selectPrevStream = 'StreamIPC:selectPrevStream',
  selectLibraryStreamInbox = 'StreamIPC:selectLibraryStreamInbox',
  selectLibraryStreamUnread = 'StreamIPC:selectLibraryStreamUnread',
  selectLibraryStreamOpen = 'StreamIPC:selectLibraryStreamOpen',
  selectLibraryStreamMark = 'StreamIPC:selectLibraryStreamMark',
  selectLibraryStreamArchived = 'StreamIPC:selectLibraryStreamArchived',
  selectSystemStreamMe = 'StreamIPC:selectSystemStreamMe',
  selectSystemStreamTeam = 'StreamIPC:selectSystemStreamTeam',
  selectSystemStreamWatching = 'StreamIPC:selectSystemStreamWatching',
  selectSystemStreamSubscription = 'StreamIPC:selectSystemStreamSubscription',
  selectUserStream = 'StreamIPC:selectUserStream',
}

class _StreamIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // stop all streams
  async stopAllStreams() {
    this.window.webContents.send(Channels.stopAllStreams);
  }

  async onStopAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.stopAllStreams, handler);
  }

  // restart all streams
  async restartAllStreams() {
    this.window.webContents.send(Channels.restartAllStreams);
  }

  async onRestartAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.restartAllStreams, handler);
  }

  // set unread count
  setUnreadCount(unreadCount: number, badge: boolean) {
    ipcRenderer.send(Channels.unreadCount, unreadCount, badge);
  }

  onSetUnreadCount(handler: (_ev, unreadCount: number, badge: boolean) => void) {
    ipcMain.on(Channels.unreadCount, handler);
  }

  // export streams
  async exportStreams(streamSettings: any[]) {
    return ipcRenderer.invoke(Channels.exportStreams, streamSettings);
  }

  onExportStreams(handler: (_ev, streamSettings: any[]) => Promise<void>) {
    ipcMain.handle(Channels.exportStreams, handler);
  };

  // import streams
  async importStreams(): Promise<{streamSettings?: any[]}> {
    return ipcRenderer.invoke(Channels.importStreams);
  }

  onImportStreams(handler: () => Promise<{streamSettings?: any[]}>) {
    ipcMain.handle(Channels.importStreams, handler);
  };

  // select next stream
  selectNextStream() {
    this.window.webContents.send(Channels.selectNextStream);
  }

  onSelectNextStream(handler: () => void) {
    ipcRenderer.on(Channels.selectNextStream, handler);
  }

  // select prev stream
  selectPrevStream() {
    this.window.webContents.send(Channels.selectPrevStream);
  }

  onSelectPrevStream(handler: () => void) {
    ipcRenderer.on(Channels.selectPrevStream, handler);
  }

  // select library stream inbox
  selectLibraryStreamInbox() {
    this.window.webContents.send(Channels.selectLibraryStreamInbox);
  }

  onSelectLibraryStreamInbox(handler: () => void) {
    ipcRenderer.on(Channels.selectLibraryStreamInbox, handler);
  }

  // select library stream unread
  selectLibraryStreamUnread() {
    this.window.webContents.send(Channels.selectLibraryStreamUnread);
  }

  onSelectLibraryStreamUnread(handler: () => void) {
    ipcRenderer.on(Channels.selectLibraryStreamUnread, handler);
  }

  // select library stream open
  selectLibraryStreamOpen() {
    this.window.webContents.send(Channels.selectLibraryStreamOpen);
  }

  onSelectLibraryStreamOpen(handler: () => void) {
    ipcRenderer.on(Channels.selectLibraryStreamOpen, handler);
  }

  // select library stream mark
  selectLibraryStreamMark() {
    this.window.webContents.send(Channels.selectLibraryStreamMark);
  }

  onSelectLibraryStreamMark(handler: () => void) {
    ipcRenderer.on(Channels.selectLibraryStreamMark, handler);
  }

  // select library stream archived
  selectLibraryStreamArchived() {
    this.window.webContents.send(Channels.selectLibraryStreamArchived);
  }

  onSelectLibraryStreamArchived(handler: () => void) {
    ipcRenderer.on(Channels.selectLibraryStreamArchived, handler);
  }

  // select system stream me
  selectSystemStreamMe() {
    this.window.webContents.send(Channels.selectSystemStreamMe);
  }

  onSelectSystemStreamMe(handler: () => void) {
    ipcRenderer.on(Channels.selectSystemStreamMe, handler);
  }

  // select system stream team
  selectSystemStreamTeam() {
    this.window.webContents.send(Channels.selectSystemStreamTeam);
  }

  onSelectSystemStreamTeam(handler: () => void) {
    ipcRenderer.on(Channels.selectSystemStreamTeam, handler);
  }

  // select system stream watching
  selectSystemStreamWatching() {
    this.window.webContents.send(Channels.selectSystemStreamWatching);
  }

  onSelectSystemStreamWatching(handler: () => void) {
    ipcRenderer.on(Channels.selectSystemStreamWatching, handler);
  }

  // select system stream subscription
  selectSystemStreamSubscription() {
    this.window.webContents.send(Channels.selectSystemStreamSubscription);
  }

  onSelectSystemStreamSubscription(handler: () => void) {
    ipcRenderer.on(Channels.selectSystemStreamSubscription, handler);
  }

  // select user stream
  selectUserStream(index: number) {
    this.window.webContents.send(Channels.selectUserStream, index);
  }

  onSelectUserStream(handler: (index: number) => void) {
    ipcRenderer.on(Channels.selectUserStream, (_ev, index: number) => handler(index));
  }
}

export const StreamIPC = new _StreamIPC();
