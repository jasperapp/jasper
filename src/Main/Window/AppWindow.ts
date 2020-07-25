import {app, BrowserView, BrowserWindow, BrowserWindowConstructorOptions, screen} from 'electron';
import {ConfigStorage} from '../Storage/ConfigStorage';
import windowStateKeeper from 'electron-window-state';
import {Platform} from '../../Util/Platform';
import os from "os";
import {BrowserViewProxy} from '../BrowserViewProxy';
import {AppEvent} from './AppEvent';
import {AppMenu} from './AppMenu';
import {GAIPC} from '../../IPC/GAIPC';

class _AppWindow {
  private appWindow: BrowserWindow;

  async init() {
    // mac(no sign): ~/Library/Application Support/jasper
    // mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
    // win         : ~\AppData\Roaming\jasper
    console.log(`Chrome data path: ${app.getPath('appData')}`);
    console.log(`config path: ${ConfigStorage.getConfigPath()}`);

    await this.createWindow();
    GAIPC.initWindow(this.appWindow);
    await AppEvent.init();
    AppMenu.applyMainMenu();
    await this.loadRenderer();
  }

  getWindow(): BrowserWindow {
    return this.appWindow;
  }

  private async createWindow() {
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

    // fixme: アイコンファイルを/Main/に持ってくる
    if (Platform.isLinux()) config.icon = `${__dirname}/../../Electron/image/icon.png`;

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
    mainWindow.webContents.setUserAgent(this.getUserAgent());

    this.appWindow = mainWindow;

    if (process.env.JASPER === 'DEV') {
      await mainWindow.webContents.openDevTools();
    }
  }

  private getUserAgent() {
    return `Jasper/${app.getVersion()} Node/${process.version} Electron/${process.versions.electron} ${os.type()}/${os.release()}`;
  }

  private async loadRenderer() {
    await this.appWindow.loadURL(`file://${__dirname}/../../Electron/html/index.html`);
    this.appWindow.webContents.send('service-ready');
    this.attachBrowserView();
  }

  private attachBrowserView() {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
      }
    });

    this.appWindow.setBrowserView(view);
    BrowserViewProxy.setBrowserView(view);
  }
}

export const AppWindow = new _AppWindow();
