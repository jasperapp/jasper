import os from 'os';
import {app, BrowserWindow, BrowserWindowConstructorOptions, powerSaveBlocker, screen} from 'electron';
import windowStateKeeper from 'electron-window-state';
import {AppEvent} from './AppEvent';
import {AppMenu} from './AppMenu';

class _AppWindow {
  private appWindow: BrowserWindow;

  async init() {
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
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
        preload: `${__dirname}/../../Renderer/asset/html/preload.js`,
        worldSafeExecuteJavaScript: true,
      },
      x: mainWindowState.x || 0,
      y: mainWindowState.y || 0,
      width: mainWindowState.width,
      height: mainWindowState.height,
    };

    // fixme: アイコンファイルを/Main/に持ってくる
    if (this.isLinux()) options.icon = `${__dirname}/../../Renderer/asset/image/icon.png`;

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
    // await this.correctCookies();
  }

  // same-siteが指定されていないものを明示的にlaxかつsecureにしてcross-siteさせる
  // 起動時に設定するだけではその後にブラウザ側で上書きされてしまうので、なにか対処が必要。
  // そもそもcookie発行側がちゃんと設定してくれるのが望ましいのだが、、、
  // @ts-ignore
  private async correctCookies() {
    const cookies = await this.appWindow.webContents.session.cookies.get({});
    for (const cookie of cookies) {
      if (cookie.sameSite !== 'unspecified') continue;
      const cookieDetail: Electron.CookiesSetDetails = {
        url: `https://${cookie.domain?.replace(/^\./, '')}/${cookie.path}`,
        secure: true,
        sameSite: 'no_restriction',
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        httpOnly: cookie.httpOnly,
        name: cookie.name,
        path: cookie.path,
        value: cookie.value,
      };
      await this.appWindow.webContents.session.cookies.set(cookieDetail);
    }
  }

  private isLinux(): boolean {
    return os.platform() === 'linux';
  }
}

export const AppWindow = new _AppWindow();
