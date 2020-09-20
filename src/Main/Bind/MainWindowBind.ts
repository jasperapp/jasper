import {BrowserWindow, nativeTheme, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow';
import {AppIPC} from '../../IPC/AppIPC';
import {AppMenu} from '../Window/AppMenu';

class _MainWindowBind {
  async bindIPC(window: BrowserWindow) {
    AppIPC.initWindow(window);

    AppIPC.onReload(async () => window.webContents.reload());
    AppIPC.onIsSystemDarkTheme(() => nativeTheme.shouldUseDarkColors);
    AppIPC.onToggleMaximizeWindow(async () => {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    });

    AppIPC.onOpenNewWindow(async (_ev, url) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(url);
        window.on('close', () => resolve());
      });
      await p;
    });

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }
}

export const MainWindowBind = new _MainWindowBind();
