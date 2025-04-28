import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { StreamEntity } from '../Renderer/Library/Type/StreamEntity';

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

  onStopAllStreams(handler: () => void) {
    ipcMain.on(Channels.stopAllStreams, handler);
  }

  // restart all streams
  async restartAllStreams() {
    this.window.webContents.send(Channels.restartAllStreams);
  }

  onRestartAllStreams(handler: () => void) {
    ipcMain.on(Channels.restartAllStreams, handler);
  }

  // set unread count
  setUnreadCount(unreadCount: number, badge: boolean) {
    ipcRenderer.send(Channels.unreadCount, unreadCount, badge);
  }

  onSetUnreadCount(handler: (_ev: Electron.IpcMainEvent, unreadCount: number, badge: boolean) => void) {
    ipcMain.on(Channels.unreadCount, handler);
  }

  // export streams
  async exportStreams(streams: StreamEntity[]): Promise<void> {
    return ipcRenderer.invoke(Channels.exportStreams, streams);
  }

  onExportStreams(handler: (_ev: Electron.IpcMainInvokeEvent, streams: StreamEntity[]) => Promise<void>) {
    ipcMain.handle(Channels.exportStreams, handler);
  }

  // import streams
  async importStreams(): Promise<StreamEntity[]> {
    return ipcRenderer.invoke(Channels.importStreams);
  }

  onImportStreams(handler: () => Promise<StreamEntity[]>) {
    ipcMain.handle(Channels.importStreams, handler);
  }

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


function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) {
      return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  return merge(mergeSort(left), mergeSort(right));
}

function merge(left: number[], right: number[]): number[] {
  let result: number[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
      if (left[leftIndex] < right[rightIndex]) {
          result.push(left[leftIndex]);
          leftIndex++;
      } else {
          result.push(right[rightIndex]);
          rightIndex++;
      }
  }

  // Concatenate the remaining elements
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// Example usage:
const array = [38, 27, 43, 3, 9, 82, 10];
const sortedArray = mergeSort(array);
console.log(sortedArray); // Output: [3, 9, 10, 27, 38, 43, 82]


export const StreamIPC = new _StreamIPC();
