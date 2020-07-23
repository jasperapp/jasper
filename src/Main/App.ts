import Logger from 'color-logger';
import electron, {app, Menu, powerSaveBlocker, ipcMain, BrowserView, powerMonitor, MenuItem} from 'electron';
import {Config} from './Config';
import {BrowserViewProxy} from './BrowserViewProxy';
import {AppPath} from './AppPath';
import {AppWindow} from './AppWindow';
import {AppMenu} from './AppMenu';
import {VersionChecker} from './Checker/VersionChecker';
import {IssuesTable} from './DB/IssuesTable';
import {DB} from './DB/DB';
import {GitHubWindow} from './GitHubWindow';
import {AccountIPC} from '../IPC/AccountIPC';
import {GitHubClientDeliver} from './GitHub/GitHubClientDeliver';
import {SystemStreamLauncher} from './Stream/SystemStreamLauncher';
import {StreamLauncher} from './Stream/StreamLauncher';
import {LoginNameSetup} from './Setup/LoginNameSetup';
import {DBSetup} from './Setup/DBSetup';
import {StreamSetup} from './Setup/StreamSetup';
import {ThemeSetup} from './Setup/ThemeSetup';
import {GA} from '../Util/GA';

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
    this.setupAccountIPC();

    // app window
    await this.setupAppWindow();
    this.setupMenu();
    this.setupAppWindowFocus();
    this.setupVersionChecker();
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

    powerMonitor.on('suspend', () => {
      Logger.n(`power monitor: suspend`);
      // do nothing
    });

    powerMonitor.on('resume', () => {
      Logger.n(`power monitor: resume`);
      this.restartStream();
      VersionChecker.restart(AppWindow.getWindow());
    });
  }

  private setupNetworkEvent() {
    ipcMain.on('online-status-changed', (_event, status) => {
      Logger.n(`network status: ${status}`);
      if (status === 'offline') {
        this.stopStream();
        GA.setNetworkAvailable(false);
      } else {
        this.restartStream();
        GA.setNetworkAvailable(true);
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

    try {
      await this.setupExternal();
    } catch(e) {
      ipcMain.once('open-github', () => {
        const githubWindow = GitHubWindow.create(Config.webHost, Config.https);
        githubWindow.on('close', () => this.setupAppWindow());
      });
      appWindow.webContents.send('service-fail');
      return;
    }

    appWindow.webContents.send('service-ready');

    this.attachBrowserView();
  }

  private setupMenu() {
    AppMenu.applyMainMenu();
  }

  private setupVersionChecker() {
    VersionChecker.start(AppWindow.getWindow());
  }

  private setupAppWindowFocus() {
    let lastFocusedRestartTime = Date.now();

    AppWindow.getWindow().on('focus', () => {
      require('../Util/GA').GA.eventAppActive();

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
    if (!app.dock) return;

    async function update() {
      if (!Config.generalBadge) {
        app.dock.setBadge('');
        return;
      }

      const count = await IssuesTable.unreadCount();
      if (count === 0) {
        app.dock.setBadge('');
      } else {
        app.dock.setBadge(count + '');
      }
    }

    update();
    DB.addExecDoneListener(update);
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

  private setupAccountIPC() {
    AccountIPC.onSwitchAccount(async (_ev, params) => {
      this.stopStream();
      Config.switchConfig(params.index);
      DB.reloadDBPath();
      await this.setupExternal();
      return {error: null};
    });
  }

  private async setupExternal() {
    await LoginNameSetup.exec();
    await DBSetup.exec();
    await StreamSetup.exec();
    await ThemeSetup.exec();
    await SystemStreamLauncher.restartAll();
    await StreamLauncher.restartAll();
  }

  private stopStream() {
    SystemStreamLauncher.stopAll();
    StreamLauncher.stopAll();
  }

  private async restartStream() {
    GitHubClientDeliver.stop(); // auto restart
    GitHubClientDeliver.stopImmediate(); // auto restart
    await LoginNameSetup.exec();
    await ThemeSetup.exec();
    await SystemStreamLauncher.restartAll();
    await StreamLauncher.restartAll();
  }

  private async restartPolling() {
    GitHubClientDeliver.stop(); // auto restart
    GitHubClientDeliver.stopImmediate(); // auto restart
    await SystemStreamLauncher.restartAll();
    await StreamLauncher.restartAll();
  }

}

export const App = new _App();
