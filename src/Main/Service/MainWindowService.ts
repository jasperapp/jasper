import {BrowserWindow} from 'electron';
import {MainWindowIPCChannels} from '../../IPC/MainWindowIPC/MainWindowIPC.channel';
import {MiscWindow} from '../Window/MiscWindow/MiscWindow';

class _MainWindowService {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // power monitor suspend
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorSuspend() {
    this.window.webContents.send(MainWindowIPCChannels.powerMonitorSuspend);
  }

  // power monitor resume
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorResume() {
    this.window.webContents.send(MainWindowIPCChannels.powerMonitorResume);
  }

  // toggle layout
  toggleLayout(layout: 'one' | 'two' | 'three') {
    this.window.webContents.send(MainWindowIPCChannels.toggleLayout, layout);
  }

  // toggle notification
  toggleNotification() {
    this.window.webContents.send(MainWindowIPCChannels.toggleNotification);
  }

  // show about
  showAbout() {
    this.window.webContents.send(MainWindowIPCChannels.showAbout);
  }

  // show pref
  showPref() {
    this.window.webContents.send(MainWindowIPCChannels.showPref);
  }

  // show jump navigation
  showJumpNavigation() {
    this.window.webContents.send(MainWindowIPCChannels.showJumpNavigation);
  }

  // show recently reads
  showRecentlyReads() {
    this.window.webContents.send(MainWindowIPCChannels.showRecentlyReads);
  }

  // show export desc
  showExportData() {
    this.window.webContents.send(MainWindowIPCChannels.showExportData);
  }

  toggleMaximizeWindow() {
    if (this.window.isMaximized()) {
      this.window.unmaximize();
    } else {
      this.window.maximize();
    }
  }

  async openNewWindow(url: string) {
    const p = new Promise<void>(resolve => {
      const window = MiscWindow.create(url);
      window.on('close', () => resolve());
    });
    await p;
  }
}

export const MainWindowService = new _MainWindowService();
