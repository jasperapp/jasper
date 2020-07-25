import Logger from 'color-logger';
import electron, {app, Menu, powerSaveBlocker, ipcMain, BrowserView, powerMonitor, MenuItem} from 'electron';
import {BrowserViewProxy} from './BrowserViewProxy';
import {AppPath} from './AppPath';
import {AppWindow} from './AppWindow';
import {AppMenu} from './AppMenu';
import {DB} from './DB/DB';
import {DBIPC} from '../IPC/DBIPC';
import {StreamIPC} from '../IPC/StreamIPC';
import {GAIPC} from '../IPC/GAIPC';
import {PowerMonitorIPC} from '../IPC/PowerMonitorIPC';
import {FSUtil} from './Util/FSUtil';
import {ConfigType} from '../Type/ConfigType';
import nodePath from "path";
import path from "path";

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
    this.setupPowerMonitorEvent();
    this.setupNetworkEvent();
    this.setupKeyboardShortcutEvent();
    this.setupURLSchemeEvent();

    // IPC
    this.setupDBIPC();

    // app window
    await this.setupAppWindow();
    this.setupMenu();
    this.setupAppWindowFocus();
    this.setupUnreadCountBadge();
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

  private setupPowerMonitorEvent() {
    powerSaveBlocker.start('prevent-app-suspension');
    powerMonitor.on('suspend', () => PowerMonitorIPC.suspend());
    powerMonitor.on('resume', () => PowerMonitorIPC.resume());
  }

  private setupNetworkEvent() {
    ipcMain.on('online-status-changed', (_event, status) => {
      Logger.n(`network status: ${status}`);
      if (status === 'offline') {
        this.stopStream();
      } else {
        this.restartStream();
      }
    });
  }

  private setupKeyboardShortcutEvent() {
    ipcMain.on('keyboard-shortcut', (_ev, enable)=>{
      const appMenu = Menu.getApplicationMenu();
      this.enableShortcut(appMenu.items[3], enable); // streams
      this.enableShortcut(appMenu.items[4], enable); // issues
      this.enableShortcut(appMenu.items[5], enable); // page
    });
  }

  // handle that open with custom URL schema.
  // jasperapp://stream?name=...&queries=...&color=...&notification=...
  private setupURLSchemeEvent() {
    electron.app.on('will-finish-launching', () => {
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

  // private setupVersionChecker() {
  //   VersionCheckerSetup.exec();
  // }

  private setupAppWindowFocus() {
    let lastFocusedRestartTime = Date.now();

    AppWindow.getWindow().on('focus', () => {
      GAIPC.eventAppActive();

      // 最終restartから30分以上たっていたら、restartする
      const nowTime = Date.now();
      if (nowTime - lastFocusedRestartTime >= 1800000) {
        lastFocusedRestartTime = nowTime;
        Logger.d('[restart streams only polling by focused]');
        this.restartPolling();
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

  private setupUnreadCountBadge() {
    StreamIPC.onSetUnreadCount((_ev, unreadCount, badge) => {
      if (!app.dock) return;

      if (unreadCount > 0 && badge) {
        app.dock.setBadge(unreadCount + '');
      } else {
        app.dock.setBadge('');
      }
    });
  }

  private enableShortcut(menu: MenuItem, enable: boolean) {
    if(!['Streams', 'Issues', 'Page'].includes(menu.label)) throw new Error(`this is unknown menu: ${menu.label}`);

    for (const item of menu.submenu.items) {
      if(item.accelerator && item.accelerator.length === 1) item.enabled = enable;

      if (item.submenu) {
        for (const _item of item.submenu.items) {
          if(_item.accelerator && _item.accelerator.length === 1) _item.enabled = enable;
        }
      }
    }
  }

  private setupDBIPC() {
    DBIPC.onExec(async (_ev, {sql, params}) => DB.exec(sql, params));
    DBIPC.onSelect(async (_ev, {sql, params}) => DB.select(sql, params));
    DBIPC.onSelectSingle(async (_ev, {sql, params}) => DB.selectSingle(sql, params));
    DBIPC.onInit(async (_ev, configIndex) => {
      const configs = FSUtil.readJSON<ConfigType[]>(AppPath.getConfigPath());
      const config = configs[configIndex];
      const dbPath = nodePath.resolve(path.dirname(AppPath.getConfigPath()), config.database.path);
      await DB.init(dbPath);
    });
  }

  private stopStream() {
    StreamIPC.stopAllStreams();
  }

  private async restartStream() {
    await StreamIPC.restartAllStreams();
  }

  private async restartPolling() {
    await StreamIPC.restartAllStreams();
  }
}

export const App = new _App();
