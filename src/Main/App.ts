import Logger from 'color-logger';
import {app, BrowserView} from 'electron';
import {BrowserViewProxy} from './BrowserViewProxy';
import {AppPath} from './AppPath';
import {AppWindow} from './AppWindow';
import {AppMenu} from './AppMenu';
import {StreamIPC} from '../IPC/StreamIPC';
import {GAIPC} from '../IPC/GAIPC';

class _App {
  async start() {
    // mac(no sign): ~/Library/Application Support/jasper
    // mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
    // win         : ~\AppData\Roaming\jasper
    Logger.n(`Chrome data path: ${app.getPath('appData')}`);
    Logger.n(`config path: ${AppPath.getConfigPath()}`);

    // event
    this.setupUnhandledRejectionEvent();
    this.setupQuitEvent();
    this.setupURLSchemeEvent();

    // app window
    await this.setupAppWindow();
    this.setupMenu();
    this.setupAppWindowFocus();
  }
  private setupUnhandledRejectionEvent() {
    process.on('unhandledRejection', (reason, p) => {
      Logger.e(`Unhandled Rejection at: ${p}`);
      Logger.e(`reason: ${reason}`);
      console.error(reason)
    });
  }

  private setupQuitEvent() {
    app.on('window-all-closed', ()=> app.quit());
  }

  // handle that open with custom URL schema.
  // jasperapp://stream?name=...&queries=...&color=...&notification=...
  private setupURLSchemeEvent() {
    app.on('will-finish-launching', () => {
      app.on('open-url', async (e, url) => {
        e.preventDefault();
        const urlObj = require('url').parse(url, true);

        if (urlObj.host === 'stream') {
          const stream = {
            name: urlObj.query.name || '',
            queries: urlObj.query.queries || '[]',
            notification: parseInt(urlObj.query.notification, 10),
            color: urlObj.query.color || ''
          };

          AppWindow.getWindow().webContents.send('create-new-stream', stream);
        }
      });
    });
  }

  private async setupAppWindow() {
    const appWindow = AppWindow.getWindow();
    await appWindow.loadURL(`file://${__dirname}/../Electron/html/index.html`);

    appWindow.webContents.send('service-ready');

    this.attachBrowserView();
  }

  private setupMenu() {
    AppMenu.applyMainMenu();
  }

  private setupAppWindowFocus() {
    let lastFocusedRestartTime = Date.now();

    AppWindow.getWindow().on('focus', () => {
      GAIPC.eventAppActive();

      // 最終restartから30分以上たっていたら、restartする
      const nowTime = Date.now();
      if (nowTime - lastFocusedRestartTime >= 1800000) {
        lastFocusedRestartTime = nowTime;
        Logger.d('[restart streams only polling by focused]');
        StreamIPC.restartAllStreams();
      }
    });
  }

  private attachBrowserView() {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
      }
    });

    AppWindow.getWindow().setBrowserView(view);
    BrowserViewProxy.setBrowserView(view);
  }
}

export const App = new _App();
