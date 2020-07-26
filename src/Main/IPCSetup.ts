import {MiscWindow} from './Window/MiscWindow';
import {DBIPC} from '../IPC/DBIPC';
import {DB} from './Storage/DB';
import {FS} from './Storage/FS';
import {app, BrowserWindow, dialog, powerMonitor} from 'electron';
import {StreamIPC} from '../IPC/StreamIPC';
import {ConfigIPC} from '../IPC/ConfigIPC';
import {ConfigStorage} from './Storage/ConfigStorage';
import {AppIPC} from '../IPC/AppIPC';
import {AppMenu} from './Window/AppMenu';
import {GAIPC} from '../IPC/GAIPC';
import {BrowserViewIPC} from '../IPC/BrowserViewIPC';
import {BrowserViewProxy} from './BrowserViewProxy';

class _IPCSetup {
  setup(window: BrowserWindow) {
    this.setupAppIPC(window);
    this.setupConfigIPC();
    this.setupDBIPC();
    this.setupStreamIPC(window);
    this.setupGAIPC(window);
    this.setupBrowserViewIPC(window);
  }

  private setupAppIPC(window: BrowserWindow) {
    AppIPC.initWindow(window);

    AppIPC.onOpenNewWindow(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(webHost, https);
        window.on('close', () => resolve());
      });
      await p;
    });

    AppIPC.onDeleteAllData(async () => {
      await DB.close();
      ConfigStorage.deleteUserData();
      app.quit();
    });

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }

  private setupConfigIPC() {
    ConfigIPC.onReadConfig(async () => ConfigStorage.readConfigs());
    ConfigIPC.onWriteConfigs(async (_ev, configs) => ConfigStorage.writeConfigs(configs));
    ConfigIPC.onDeleteConfig(async (_ev, index) => ConfigStorage.deleteConfig(index));
  }

  private setupDBIPC() {
    DBIPC.onExec(async (_ev, {sql, params}) => DB.exec(sql, params));
    DBIPC.onSelect(async (_ev, {sql, params}) => DB.select(sql, params));
    DBIPC.onSelectSingle(async (_ev, {sql, params}) => DB.selectSingle(sql, params));
    DBIPC.onInit(async (_ev, configIndex) => {
      const dbPath = ConfigStorage.getDBPath(configIndex);
      await DB.init(dbPath);
    });
  }

  private setupStreamIPC(window: BrowserWindow) {
    StreamIPC.initWindow(window);
    StreamIPC.onSetUnreadCount((_ev, unreadCount, badge) => {
      if (!app.dock) return;

      if (unreadCount > 0 && badge) {
        app.dock.setBadge(unreadCount + '');
      } else {
        app.dock.setBadge('');
      }
    });

    StreamIPC.onExportStreams(async (_ev, streamSettings) => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const filePath = dialog.showSaveDialogSync({defaultPath});
      if (!filePath) return;
      FS.writeJSON(filePath, streamSettings);
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return {streamSettings: FS.readJSON(filePath)};
    });
  }

  private setupGAIPC(window: BrowserWindow) {
    GAIPC.initWindow(window);
  }

  private setupBrowserViewIPC(window: BrowserWindow) {
    BrowserViewIPC.initWindow(window)

    const webContents = BrowserViewProxy.getWebContents();

    BrowserViewIPC.onLoadURL(async (_ev, url) => BrowserViewProxy.loadURL(url));
    BrowserViewIPC.onGetURL(() => BrowserViewProxy.getURL());
    BrowserViewIPC.onSetOffsetLeft((_ev, offset) => BrowserViewProxy.setOffsetLeft(offset));
    BrowserViewIPC.onHide((_ev, flag) => BrowserViewProxy.hide(flag));
    BrowserViewIPC.onReload(async () => webContents.reload());
    BrowserViewIPC.onCanGoBack(() => webContents.canGoBack());
    BrowserViewIPC.onCanGoForward(() => webContents.canGoForward());
    BrowserViewIPC.onGoBack(async () => webContents.goBack());
    BrowserViewIPC.onGoForward(async () => webContents.goForward());
    BrowserViewIPC.onFocus(async () => webContents.focus());
    BrowserViewIPC.onBlur(async () => window.webContents.focus());
    BrowserViewIPC.onCut(() => webContents.cut());
    BrowserViewIPC.onPaste(() => webContents.paste());
    BrowserViewIPC.onExecuteJavaScript((_ev, js) => webContents.executeJavaScript(js));
    BrowserViewIPC.onInsertCSS((_ev, css) => { webContents.insertCSS(css); }); // 値を返却するとエラーになるので{}で囲む
    BrowserViewIPC.onFindInPage((_ev, keyword, options) => webContents.findInPage(keyword, options));
    BrowserViewIPC.onStopFindInPage((_ev, action) => webContents.stopFindInPage(action));

    webContents.addListener('console-message', (_ev, level, message) => BrowserViewIPC.eventConsoleMessage(level, message));
    webContents.addListener('dom-ready', () => BrowserViewIPC.eventDOMReady());
    webContents.addListener('did-start-loading', () => BrowserViewIPC.eventDidStartLoading());
    webContents.addListener('did-navigate', () => BrowserViewIPC.eventDidNavigate());
    webContents.addListener('did-navigate-in-page', () => BrowserViewIPC.eventDidNavigateInPage());
    webContents.addListener('before-input-event', (_ev, input) => BrowserViewIPC.eventBeforeInput(input));
    webContents.addListener('found-in-page', (_ev, result) => BrowserViewIPC.eventFoundInPage(result));
    webContents.session.on('will-download', () => BrowserViewIPC.eventWillDownload());
  }
}

export const IPCSetup = new _IPCSetup();