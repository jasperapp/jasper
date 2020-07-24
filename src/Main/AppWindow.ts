import os from 'os';
import {app, BrowserWindow, BrowserWindowConstructorOptions, screen} from 'electron';
import windowStateKeeper from 'electron-window-state';
import {Platform} from '../Util/Platform';

class _AppWindow {
  private appWindow: BrowserWindow;

  async init() {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const mainWindowState = windowStateKeeper({
      defaultWidth: Math.min(width, 1680),
      defaultHeight: Math.min(height, 1027),
    });

    const config: BrowserWindowConstructorOptions = {
      title: 'Jasper',
      webPreferences: {
        nodeIntegration: true
      },
      x: mainWindowState.x || 0,
      y: mainWindowState.y || 0,
      width: mainWindowState.width,
      height: mainWindowState.height,
    };

    if (Platform.isLinux()) config.icon = `${__dirname}/../Electron/image/icon.png`;

    const mainWindow = new BrowserWindow(config);

    // 複数のディスプレイを使っている場合、ウィンドウの位置/サイズのリストアが不安定
    // e.g. メインディスプレイより大きなサイズや、サブディスプレイに表示している場合など
    // なので、作成したあとに再度サイズを設定し直す
    // 多分electronの不具合
    mainWindow.setPosition(mainWindowState.x || 0, mainWindowState.y || 0, false);
    mainWindow.setSize(mainWindowState.width, mainWindowState.height)
    mainWindowState.manage(mainWindow);

    // prevent external web page
    mainWindow.webContents.on('will-navigate', (ev, _url)=> ev.preventDefault());

    // user agent
    const ua = `Jasper/${app.getVersion()} Node/${process.version} Electron/${process.versions.electron} ${os.type()}/${os.release()}`;
    mainWindow.webContents.setUserAgent(ua);

    this.appWindow = mainWindow;

    if (process.env.JASPER === 'DEV') {
      await mainWindow.webContents.openDevTools();
    }
  }

  getWindow() {
    return this.appWindow;
  }
}

export const AppWindow = new _AppWindow();
