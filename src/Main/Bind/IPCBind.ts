import fs from 'fs';
import {app, BrowserWindow, dialog, nativeTheme, powerMonitor} from 'electron';
import {MiscWindow} from '../Window/MiscWindow';
import {StreamIPC} from '../../IPC/StreamIPC';
import {AppIPC} from '../../IPC/AppIPC';
import {AppMenu} from '../Window/AppMenu';
import {IssueIPC} from '../../IPC/IssueIPC';

class _IPCBind {
  init(window: BrowserWindow) {
    this.initAppIPC(window);
    // this.initUserPrefIPC();
    // this.initSQLiteIPC();
    this.initIssueIPC(window);
    this.initStreamIPC(window);
    // this.initBrowserViewIPC(window);
  }

  private initAppIPC(window: BrowserWindow) {
    AppIPC.initWindow(window);

    AppIPC.onReload(async () => window.webContents.reload());
    AppIPC.onIsSystemDarkTheme(() => nativeTheme.shouldUseDarkColors);
    AppIPC.onToggleMaximizeWindow(async () => {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    });

    AppIPC.onOpenNewWindow(async (_ev, url) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(url);
        window.on('close', () => resolve());
      });
      await p;
    });

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }

  // private initUserPrefIPC() {
  //   UserPrefIPC.onRead(async () => UserPrefBind.read());
  //   UserPrefIPC.onWrite(async (text) => UserPrefBind.write(text));
  //   UserPrefIPC.onDeleteRelativeFile(async (relativeFilePath) => UserPrefBind.deleteRelativeFile(relativeFilePath));
  //   UserPrefIPC.onGetAbsoluteFilePath(async (relativeFilePath) => UserPrefBind.getAbsoluteFilePath(relativeFilePath));
  //   UserPrefIPC.onGetEachPaths(async () => UserPrefBind.getEachPaths());
  // }

  private initIssueIPC(window: BrowserWindow) {
    IssueIPC.initWindow(window);
  }

  // private initSQLiteIPC() {
  //   SQLiteIPC.onInit(async (_ev, dbPath) => SQLiteBind.init(dbPath));
  //   SQLiteIPC.onExec(async (_ev, {sql, params}) => SQLiteBind.exec(sql, params));
  //   SQLiteIPC.onSelect(async (_ev, {sql, params}) => SQLiteBind.select(sql, params));
  //   SQLiteIPC.onSelectSingle(async (_ev, {sql, params}) => SQLiteBind.selectSingle(sql, params));
  //   SQLiteIPC.onDeleteDBFile(async () => await SQLiteBind.deleteDBFile());
  // }

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

    StreamIPC.onExportStreams(async (_ev, streams) => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const filePath = dialog.showSaveDialogSync({defaultPath});
      if (!filePath) return;
      fs.writeFileSync(filePath, JSON.stringify(streams, null, 2));
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return JSON.parse(fs.readFileSync(filePath).toString());
    });
  }

  // private initBrowserViewIPC(window: BrowserWindow) {
  //   BrowserViewIPC.initWindow(window)
  //
  //   const webContents = BrowserViewBind.getWebContents();
  //
  //   BrowserViewIPC.onLoadURL(async (_ev, url) => BrowserViewBind.loadURL(url));
  //   BrowserViewIPC.onGetURL(() => BrowserViewBind.getURL());
  //   BrowserViewIPC.onHide((_ev, flag) => BrowserViewBind.hide(flag));
  //   BrowserViewIPC.onReload(async () => webContents.reload());
  //   BrowserViewIPC.onCanGoBack(() => webContents.canGoBack());
  //   BrowserViewIPC.onCanGoForward(() => webContents.canGoForward());
  //   BrowserViewIPC.onGoBack(async () => webContents.goBack());
  //   BrowserViewIPC.onGoForward(async () => webContents.goForward());
  //   BrowserViewIPC.onFocus(async () => webContents.focus());
  //   BrowserViewIPC.onBlur(async () => window.webContents.focus());
  //   BrowserViewIPC.onExecuteJavaScript((_ev, js) => webContents.executeJavaScript(js));
  //   BrowserViewIPC.onInsertCSS((_ev, css) => { webContents.insertCSS(css); }); // 値を返却するとエラーになるので{}で囲む
  //   BrowserViewIPC.onFindInPage((_ev, keyword, options) => webContents.findInPage(keyword, options));
  //   BrowserViewIPC.onStopFindInPage((_ev, action) => webContents.stopFindInPage(action));
  //   BrowserViewIPC.onSetRect((x, y, width, height) => BrowserViewBind.setRect(x, y, width, height))
  //   BrowserViewIPC.onSetBackgroundColor(color => BrowserViewBind.setBackgroundColor(color))
  //
  //   webContents.addListener('console-message', (_ev, level, message) => BrowserViewIPC.eventConsoleMessage(level, message));
  //   webContents.addListener('dom-ready', () => BrowserViewIPC.eventDOMReady());
  //   webContents.addListener('did-start-navigation', (_ev, url, inPage) => BrowserViewIPC.eventDidStartNavigation(url, inPage));
  //   webContents.addListener('did-navigate', () => BrowserViewIPC.eventDidNavigate());
  //   webContents.addListener('did-navigate-in-page', () => BrowserViewIPC.eventDidNavigateInPage());
  //   webContents.addListener('before-input-event', (_ev, input) => BrowserViewIPC.eventBeforeInput(input));
  //   webContents.addListener('found-in-page', (_ev, result) => BrowserViewIPC.eventFoundInPage(result));
  //   webContents.session.on('will-download', () => BrowserViewIPC.eventWillDownload());
  // }
}

export const IPCBind = new _IPCBind();
