import {app, BrowserWindow, dialog, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow';
import {FSBind} from './FSBind';
import {StreamIPC} from '../../IPC/StreamIPC';
import {AppIPC} from '../../IPC/AppIPC';
import {AppMenu} from '../Window/AppMenu';
import {GAIPC} from '../../IPC/GAIPC';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {BrowserViewBind} from './BrowserViewBind';
import {IssueIPC} from '../../IPC/IssueIPC';
import {FSIPC} from '../../IPC/FSIPC';
import {SQLiteBind} from './SQLiteBind';
import {SQLiteIPC} from '../../IPC/SQLiteIPC';
import {AppPathIPC} from '../../IPC/AppPathIPC';
import {AppPathBind} from './AppPathBind';

class _IPCBind {
  init(window: BrowserWindow) {
    this.initAppIPC(window);
    this.initFSIPC();
    this.initSQLiteIPC();
    this.initAppPathIPC();
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

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }

  private initIssueIPC(window: BrowserWindow) {
    IssueIPC.initWindow(window);
  }

  private initAppPathIPC() {
    AppPathIPC.onGetUserDataPath(async () => AppPathBind.getUserDataPath());
    AppPathIPC.onGetAppDataPath(async () => AppPathBind.getAppDataPath());
    AppPathIPC.onGetAbsPath(async (path, currentFilePath) => AppPathBind.getAbsPath(path, currentFilePath));
    AppPathIPC.onGetPrefDir(async () => AppPathBind.getPrefDirPath());
    AppPathIPC.onGetPrefPath(async () => AppPathBind.getPrefPath());
  }

  private initFSIPC() {
    FSIPC.onExist(async (path) => FSBind.exist(path));
    FSIPC.onMkdir(async (path) => FSBind.mkdir(path));
    FSIPC.onRead(async (path) => FSBind.read(path));
    FSIPC.onRm(async (path) => FSBind.rm(path));
    FSIPC.onRmdir(async (path) => FSBind.rmdir(path));
    FSIPC.onWrite(async (path, text) => FSBind.write(path, text));
  }

  private initSQLiteIPC() {
    SQLiteIPC.onInit(async (_ev, dbPath) => await SQLiteBind.init(dbPath));
    SQLiteIPC.onExec(async (_ev, {sql, params}) => SQLiteBind.exec(sql, params));
    SQLiteIPC.onSelect(async (_ev, {sql, params}) => SQLiteBind.select(sql, params));
    SQLiteIPC.onSelectSingle(async (_ev, {sql, params}) => SQLiteBind.selectSingle(sql, params));
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
      FSBind.write(filePath, JSON.stringify(streamSettings, null, 2));
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return {streamSettings: JSON.parse(FSBind.read(filePath))};
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
