import {BrowserWindow, nativeTheme, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow';
import {AppIPC} from '../../IPC/AppIPC';
import {AppMenu} from '../Window/AppMenu';

class _MainWindowBind {
  private window: BrowserWindow;

  async bindIPC(window: BrowserWindow) {
    this.window = window;
    AppIPC.initWindow(window);

    AppIPC.onReload(async () => window.webContents.reload());
    AppIPC.onIsSystemDarkTheme(() => nativeTheme.shouldUseDarkColors);
    AppIPC.onToggleMaximizeWindow(async () => this.toggleMaximizeWindow());
    AppIPC.onOpenNewWindow(async (_ev, url) => this.openNewWindow(url));
    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));
    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
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
