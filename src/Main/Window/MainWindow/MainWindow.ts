import os from 'os';
import {app, BrowserWindow, BrowserWindowConstructorOptions, powerSaveBlocker, screen} from 'electron';
import windowStateKeeper from 'electron-window-state';
import {MainWindowEvent} from './MainWindowEvent';
import {MainWindowMenu} from './MainWindowMenu';
import {PathUtil} from '../../Util/PathUtil';

class _MainWindow {
  private mainWindow: BrowserWindow;

  async init() {
    powerSaveBlocker.start('prevent-app-suspension');

    await this.initWindow();
    await MainWindowEvent.init();
    await MainWindowMenu.init();
  }

  getWindow(): BrowserWindow {
    return this.mainWindow;
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
        preload: PathUtil.getPath('/Renderer/asset/html/main-window-preload.js'),
      },
      x: mainWindowState.x || 0,
      y: mainWindowState.y || 0,
      width: mainWindowState.width,
      height: mainWindowState.height,
    };

    // fixme: アイコンファイルを/Main/に持ってくる
    if (this.isLinux()) options.icon = PathUtil.getPath('/Renderer/asset/image/icon.png');

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

    this.mainWindow = mainWindow;

    if (process.env.JASPER === 'DEV' || parseInt(process.env.DEVTOOLS, 10) === 1) await mainWindow.webContents.openDevTools({mode: 'detach'});
  }

  private getUserAgent() {
    return `Jasper/${app.getVersion()} Node/${process.version} Electron/${process.versions.electron} Chrome/${process.versions.chrome} ${os.type()}/${os.release()} Platform/${os.platform()}`;
  }

  async initRenderer() {
    await this.mainWindow.loadURL(`file://${PathUtil.getPath('/Renderer/asset/html/main-window.html')}`);
    // await this.correctCookies();

    await this.rewritePrivateModeUserSessionCookie();
  }

  private async rewritePrivateModeUserSessionCookie() {
    const setSameSiteToNone = async (cookie: Electron.Cookie) => {
      await this.mainWindow.webContents.session.cookies.set({
        url: `https://${cookie.domain?.replace(/^\./, '')}${cookie.path}`,
        secure: cookie.secure,
        sameSite: 'no_restriction',
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        httpOnly: cookie.httpOnly,
        name: cookie.name,
        path: cookie.path,
        value: cookie.value,
      });
    }

    const privateModeSessionCookies = await this.mainWindow.webContents.session.cookies.get({ name: 'private_mode_user_session' });
    for (const cookie of privateModeSessionCookies) {
      if (/github\.com$/.test(cookie.domain)) continue;
      if (cookie.sameSite !== 'lax') continue;

      await setSameSiteToNone(cookie);
    }

    this.mainWindow.webContents.session.cookies.addListener('changed', async (_, cookie, cause, removed) => {
      if (/github\.com$/.test(cookie.domain)) return;
      if (cookie.name !== 'private_mode_user_session') return;
      if (cookie.sameSite !== 'lax') return;
      if (cause !== 'explicit' && cause !== 'overwrite') return;
      if (removed) return;

      await setSameSiteToNone(cookie);
    })
  }

  // same-siteが指定されていないものを明示的にlaxかつsecureにしてcross-siteさせる
  // 起動時に設定するだけではその後にブラウザ側で上書きされてしまうので、なにか対処が必要。
  // そもそもcookie発行側がちゃんと設定してくれるのが望ましいのだが、、、
  // @ts-ignore
  private async correctCookies() {
    const cookies = await this.mainWindow.webContents.session.cookies.get({});
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
      await this.mainWindow.webContents.session.cookies.set(cookieDetail);
    }
  }

  private isLinux(): boolean {
    return os.platform() === 'linux';
  }
}

export const MainWindow = new _MainWindow();
