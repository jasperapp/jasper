import {app, BrowserWindow, dialog} from 'electron';
import fs from 'fs';
import {StreamIPCChannels} from '../../IPC/Stream/StreamIPC.channel';

class _StreamService {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  async stopAllStreams() {
    this.window.webContents.send(StreamIPCChannels.stopAllStreams);
  }

  async restartAllStreams() {
    this.window.webContents.send(StreamIPCChannels.restartAllStreams);
  }

  selectNextStream() {
    this.window.webContents.send(StreamIPCChannels.selectNextStream);
  }

  selectPrevStream() {
    this.window.webContents.send(StreamIPCChannels.selectPrevStream);
  }

  selectLibraryStreamInbox() {
    this.window.webContents.send(StreamIPCChannels.selectLibraryStreamInbox);
  }

  selectLibraryStreamUnread() {
    this.window.webContents.send(StreamIPCChannels.selectLibraryStreamUnread);
  }

  selectLibraryStreamOpen() {
    this.window.webContents.send(StreamIPCChannels.selectLibraryStreamOpen);
  }

  selectLibraryStreamMark() {
    this.window.webContents.send(StreamIPCChannels.selectLibraryStreamMark);
  }

  selectLibraryStreamArchived() {
    this.window.webContents.send(StreamIPCChannels.selectLibraryStreamArchived);
  }

  selectSystemStreamMe() {
    this.window.webContents.send(StreamIPCChannels.selectSystemStreamMe);
  }

  selectSystemStreamTeam() {
    this.window.webContents.send(StreamIPCChannels.selectSystemStreamTeam);
  }

  selectSystemStreamWatching() {
    this.window.webContents.send(StreamIPCChannels.selectSystemStreamWatching);
  }

  selectSystemStreamSubscription() {
    this.window.webContents.send(StreamIPCChannels.selectSystemStreamSubscription);
  }

  selectUserStream(index: number) {
    this.window.webContents.send(StreamIPCChannels.selectUserStream, index);
  }

  setUnreadCount(unreadCount: number, badge: boolean) {
    if (!app.dock) return;

    if (unreadCount > 0 && badge) {
      app.dock.setBadge(unreadCount + '');
    } else {
      app.dock.setBadge('');
    }
  }

  exportStreams(streams: any[]) {
    const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
    const filePath = dialog.showSaveDialogSync({defaultPath});
    if (!filePath) return;
    fs.writeFileSync(filePath, JSON.stringify(streams, null, 2));
  }

  importStreams() {
    const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
    const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
    if (!tmp || !tmp.length) return;

    const filePath = tmp[0];
    return JSON.parse(fs.readFileSync(filePath).toString());
  }
}

export const StreamService = new _StreamService();
