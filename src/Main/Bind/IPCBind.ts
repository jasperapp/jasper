import {app, BrowserWindow, dialog, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow';
import {DBIPC} from '../../IPC/DBIPC';
import {DB} from '../Storage/DB';
import {FS} from '../Storage/FS';
import {StreamIPC} from '../../IPC/StreamIPC';
import {UserPrefIPC} from '../../IPC/UserPrefIPC';
import {UserPrefStorage} from '../Storage/UserPrefStorage';
import {AppIPC} from '../../IPC/AppIPC';
import {AppMenu} from '../Window/AppMenu';
import {GAIPC} from '../../IPC/GAIPC';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {BrowserViewBind} from './BrowserViewBind';
import {IssueIPC} from '../../IPC/IssueIPC';

class _IPCBind {
  init(window: BrowserWindow) {
    this.initAppIPC(window);
    this.initUserPrefIPC();
    this.initDBIPC();
    this.initIssueIPC(window);
    this.initStreamIPC(window);
    this.initBrowserViewIPC(window);
    this.initGAIPC(window);
  }

  private initAppIPC(window: BrowserWindow) {
    AppIPC.initWindow(window);

    AppIPC.onReload(async () => window.webContents.reload());

    AppIPC.onOpenNewWindow(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(webHost, https);
        window.on('close', () => resolve());
      });
      await p;
    });

    AppIPC.onDeleteAllData(async () => {
      await DB.close();
      UserPrefStorage.deleteUserData();
      app.quit();
    });

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }

  private initIssueIPC(window: BrowserWindow) {
    IssueIPC.initWindow(window);
  }

  private initUserPrefIPC() {
    UserPrefIPC.onReadPrefs(async () => UserPrefStorage.readPrefs());
    UserPrefIPC.onWritePrefs(async (_ev, prefs) => UserPrefStorage.writePrefs(prefs));
    UserPrefIPC.onDeletePref(async (_ev, index) => UserPrefStorage.deletePref(index));
  }

  private initDBIPC() {
    DBIPC.onExec(async (_ev, {sql, params}) => DB.exec(sql, params));
    DBIPC.onSelect(async (_ev, {sql, params}) => DB.select(sql, params));
    DBIPC.onSelectSingle(async (_ev, {sql, params}) => DB.selectSingle(sql, params));
    DBIPC.onInit(async (_ev, prefIndex) => {
      const dbPath = UserPrefStorage.getDBPath(prefIndex);
      await DB.init(dbPath);
    });
  }

  private initStreamIPC(window: BrowserWindow) {
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

  private initGAIPC(window: BrowserWindow) {
    GAIPC.initWindow(window);
  }

  private initBrowserViewIPC(window: BrowserWindow) {
    BrowserViewIPC.initWindow(window)

    const webContents = BrowserViewBind.getWebContents();

    BrowserViewIPC.onLoadURL(async (_ev, url) => BrowserViewBind.loadURL(url));
    BrowserViewIPC.onGetURL(() => BrowserViewBind.getURL());
    BrowserViewIPC.onHide((_ev, flag) => BrowserViewBind.hide(flag));
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
    BrowserViewIPC.onScrollDown(() => BrowserViewBind.scrollDown());
    BrowserViewIPC.onScrollUp(() => BrowserViewBind.scrollUp());
    BrowserViewIPC.onSetRect((x, y, width, height) => BrowserViewBind.setRect(x, y, width, height))

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

export const IPCBind = new _IPCBind();
