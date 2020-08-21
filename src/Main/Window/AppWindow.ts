import {app, BrowserWindow, BrowserWindowConstructorOptions, powerSaveBlocker, screen} from 'electron';
import {UserPrefStorage} from '../Storage/UserPrefStorage';
import windowStateKeeper from 'electron-window-state';
import {PlatformUtil} from '../Util/PlatformUtil';
import os from "os";
import {AppEvent} from './AppEvent';
import {AppMenu} from './AppMenu';

class _AppWindow {
  private appWindow: BrowserWindow;

  async init() {
    // mac(no sign): ~/Library/Application Support/jasper
    // mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
    // win         : ~\AppData\Roaming\jasper
    console.log(`Chrome data path: ${app.getPath('appData')}`);
    console.log(`pref path: ${UserPrefStorage.getPrefPath()}`);

    powerSaveBlocker.start('prevent-app-suspension');

    await this.initWindow();
    await AppEvent.init();
    await AppMenu.init();
  }

  getWindow(): BrowserWindow {
    return this.appWindow;
  }

  private async initWindow() {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;
    const mainWindowState = windowStateKeeper({
      defaultWidth: Math.min(width, 1680),
      defaultHeight: Math.min(height, 1027),
    });

    const options: BrowserWindowConstructorOptions = {
      title: 'Jasper',
      webPreferences: {
        nodeIntegration: true
      },
      x: mainWindowState.x || 0,
      y: mainWindowState.y || 0,
      width: mainWindowState.width,
      height: mainWindowState.height,
    };

    // fixme: アイコンファイルを/Main/に持ってくる
    if (PlatformUtil.isLinux()) options.icon = `${__dirname}/../../Renderer/image/icon.png`;

    const mainWindow = new BrowserWindow(options);

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
    mainWindow.webContents.setUserAgent(this.getUserAgent());

    this.appWindow = mainWindow;

    if (process.env.JASPER === 'DEV') await mainWindow.webContents.openDevTools({mode: 'detach'});
  }

  private getUserAgent() {
    return `Jasper/${app.getVersion()} Node/${process.version} Electron/${process.versions.electron} ${os.type()}/${os.release()} Platform/${os.platform()}`;
  }

  async initRenderer() {
    await this.appWindow.loadURL(`file://${__dirname}/../../Renderer/asset/html/index.html`);
  }
}

export const AppWindow = new _AppWindow();
