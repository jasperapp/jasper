import {ipcRenderer} from 'electron';
import {AppWindow} from '../Main/AppWindow';

enum Channels {
  stopAllStreams = 'stopAllStream',
  restartAllStreams = 'restartAllStreams',
}

class _StreamIPC {
  // stop all streams
  async stopAllStreams() {
    AppWindow.getWindow().webContents.send(Channels.stopAllStreams);
  }

  async onStopAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.stopAllStreams, handler);
  }

  // restart all streams
  async restartAllStreams() {
    AppWindow.getWindow().webContents.send(Channels.restartAllStreams);
  }

  async onRestartAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.restartAllStreams, handler);
  }
}

export const StreamIPC = new _StreamIPC();
