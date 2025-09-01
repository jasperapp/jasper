import {BrowserWindow, ipcMain, nativeTheme, powerMonitor} from 'electron';
import {MainWindowService} from '../../Main/Service/MainWindowService';
import {MainWindowMenu} from '../../Main/Window/MainWindow/MainWindowMenu';
import {MainWindowIPCChannels} from './MainWindowIPC.channel';

export function mainWindowIPCBind(window: BrowserWindow) {
  ipcMain.handle(MainWindowIPCChannels.reload, () => {
    return window.webContents.reload();
  });

  ipcMain.handle(MainWindowIPCChannels.isSystemDarkTheme, (_ev) => {
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle(MainWindowIPCChannels.toggleMaximizeWindow, () => {
    return MainWindowService.toggleMaximizeWindow();
  });

  ipcMain.handle(MainWindowIPCChannels.openNewWindow, (_ev, url: string) => {
    return MainWindowService.openNewWindow(url);
  });

  ipcMain.handle(MainWindowIPCChannels.keyboardShortcut, (_ev, enable: boolean) => {
    return MainWindowMenu.enableShortcut(enable);
  });

  powerMonitor.on('suspend', () => MainWindowService.powerMonitorSuspend());
  powerMonitor.on('resume', () => MainWindowService.powerMonitorResume());
}
