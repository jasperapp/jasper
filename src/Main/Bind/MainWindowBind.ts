import {BrowserWindow, nativeTheme, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow/MiscWindow';
import {MainWindowIPC} from '../../IPC/MainWindowIPC';
import {MainWindowMenu} from '../Window/MainWindow/MainWindowMenu';

class _MainWindowBind {
  private window: BrowserWindow;

  async bindIPC(window: BrowserWindow) {
    this.window = window;
    MainWindowIPC.initWindow(window);

    MainWindowIPC.onReload(async () => window.webContents.reload());
    MainWindowIPC.onIsSystemDarkTheme(() => nativeTheme.shouldUseDarkColors);
    MainWindowIPC.onToggleMaximizeWindow(async () => this.toggleMaximizeWindow());
    MainWindowIPC.onOpenNewWindow(async (_ev, url) => this.openNewWindow(url));
    MainWindowIPC.onKeyboardShortcut((_ev, enable) => MainWindowMenu.enableShortcut(enable));
    powerMonitor.on('suspend', () => MainWindowIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => MainWindowIPC.powerMonitorResume());
  }

  private async toggleMaximizeWindow() {
    if (this.window.isMaximized()) {
      this.window.unmaximize();
    } else {
      this.window.maximize();
    }
  }

  private async openNewWindow(url: string) {
    const p = new Promise(resolve => {
      const window = MiscWindow.create(url);
      window.on('close', () => resolve());
    });
    await p;
  }
}

export const MainWindowBind = new _MainWindowBind();
