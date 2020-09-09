import {BrowserWindow} from 'electron';
import {AppWindow} from './AppWindow';

class _MiscWindow {
  create(url: string): BrowserWindow {
    const miscWindow = new BrowserWindow({
      center: true,
      width: 1024,
      height: 800,
      parent: AppWindow.getWindow(),
      alwaysOnTop: true,
    });

    miscWindow.webContents.on('did-finish-load', () => {
      const url = new URL(miscWindow.webContents.getURL());
      miscWindow.setTitle(url.origin);
    });

    miscWindow.loadURL(url);
    return miscWindow;
  }
}

export const MiscWindow = new _MiscWindow();
