import {AppWindow} from '../Main/AppWindow';
import {ipcRenderer} from 'electron';

enum Channels {
  suspend = 'suspend',
  resume = 'resume',
}

// only Linux and Windows
// https://www.electronjs.org/docs/api/power-monitor
class _PowerMonitorIPC {
  suspend() {
    AppWindow.getWindow().webContents.send(Channels.suspend);
  }

  onSuspend(handler: () => void) {
    ipcRenderer.on(Channels.suspend, handler);
  }

  resume() {
    AppWindow.getWindow().webContents.send(Channels.resume);
  }

  onResume(handler: () => void) {
    ipcRenderer.on(Channels.resume, handler);
  }
}

export const PowerMonitorIPC = new _PowerMonitorIPC();
