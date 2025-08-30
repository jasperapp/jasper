import {BrowserView, BrowserWindow, clipboard, Menu, MenuItem, Rectangle, shell} from 'electron';
import fs from 'node:fs';
import nodePath from 'node:path';
import os from 'os';
import {BrowserViewIPCChannels} from '../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {ShellUtil} from '../../Renderer/Library/Util/ShellUtil';
import {PathUtil} from '../Util/PathUtil';
import {MainWindowMenu} from '../Window/MainWindow/MainWindowMenu';
import {browserViewMc} from './BrowserViewTranslateService';

type Target = {
  window: BrowserWindow | null;
  browserView: BrowserView | null;
  rect: Rectangle | null;
  zoomFactor: number;
  hideCount: number;
};

class _BrowserViewService {
  private main: Target = {
    window: null,
    browserView: null,
    rect: null,
    zoomFactor: 1,
    hideCount: 0,
  };

  private issue: Target = {
    window: null,
    browserView: null,
    rect: null,
    zoomFactor: 1,
    hideCount: 0,
  };

  private window: BrowserWindow;
  private active: Target = this.main;

  initWindow(window: BrowserWindow) {
    this.window = window;
    this.setupMainWindow(window);
    this.setupIssueWindow();

    [this.main.browserView.webContents, this.issue.browserView.webContents].forEach(webContents => {
      webContents.addListener('console-message', (_ev, level, message) => BrowserViewService.eventConsoleMessage(level, message));
      webContents.addListener('dom-ready', () => BrowserViewService.eventDOMReady());
      webContents.addListener('did-start-navigation', (_ev, url, inPage) => BrowserViewService.eventDidStartNavigation(url, inPage));
      webContents.addListener('did-navigate', () => BrowserViewService.eventDidNavigate());
      webContents.addListener('did-navigate-in-page', () => BrowserViewService.eventDidNavigateInPage());
      webContents.addListener('before-input-event', (_ev, input) => BrowserViewService.eventBeforeInput(input));
      webContents.addListener('found-in-page', (_ev, result) => BrowserViewService.eventFoundInPage(result));
      webContents.session.on('will-download', () => BrowserViewService.eventWillDownload());
    });
  }

  private setupMainWindow(mainWindow: BrowserWindow) {
    this.main.window = mainWindow;
    this.setupWindow(this.main);

    // GitHub Projectでissueを開くとサイドパネルで開くようになったので、IssueWindowを開く必要はなくなった
    // // github projectでissueをクリックしたときにissue windowで開くようにするため。
    // this.main.browserView.webContents.setWindowOpenHandler((details) => {
    //   this.openIssueWindow(details.url);
    //   return {action: 'deny'};
    // });
  }

  private setupIssueWindow() {
    this.issue.window = new BrowserWindow({
      title: 'Jasper',
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        preload: PathUtil.getPath('/Renderer/Preload/issue-window-preload.cjs'),
      },
      parent: this.main.window,
      show: false,
    });

    this.issue.window.webContents.setUserAgent(this.main.window.webContents.userAgent);
    this.issue.window.loadFile(nodePath.join(__dirname, `Renderer/asset/html/issue-window.html`));
    this.issue.window.setBrowserView(this.issue.browserView);
    this.issue.window.addListener('close', (ev) => {
      ev.preventDefault();
      this.closeIssueWindow();
    });
    this.setupWindow(this.issue);
  }

  private setupWindow(target: Target) {
    target.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
      }
    });
    target.window?.setBrowserView(target.browserView);
    target.browserView.setBackgroundColor('#fff');

    // zoom factorはURLを読み込んでからではないと取得できないため、dom-readyをハンドルしている
    target.window?.webContents.once('dom-ready', () => {
      this.setZoomFactor(target.window.webContents.getZoomFactor());
    });

    this.setupContextMenu(target);
  }

  private setupContextMenu(target: Target) {
    const webContents = target.browserView.webContents;
    webContents.addListener('dom-ready', () => {
      const jsFilePath = nodePath.resolve(__dirname, '../asset/js/context-menu.js');
      const js = fs.readFileSync(jsFilePath).toString();
      target.browserView.webContents.executeJavaScript(js);
    });

    webContents.addListener('console-message', (_ev, _level, message) => {
      if (message.indexOf('CONTEXT_MENU:') !== 0) return;

      const data = JSON.parse(message.split('CONTEXT_MENU:')[1]);

      const menu = new Menu();
      if (data.url) {
        menu.append(new MenuItem({label: browserViewMc().url.open, click: () => ShellUtil.openExternal(data.url)}));
        menu.append(new MenuItem({label: browserViewMc().url.copy, click: () => clipboard.writeText(data.url)}));
        menu.append(new MenuItem({type: 'separator'}));
      }

      if (data.text) {
        if (os.platform() === 'darwin') {
          menu.append(new MenuItem({label: browserViewMc().search, click: () => shell.openExternal(`dict://${data.text}`)}));
          menu.append(new MenuItem({type: 'separator'}));
        }

        menu.append(new MenuItem({label: browserViewMc().text.copy, click: () => clipboard.writeText(data.text)}));
        menu.append(new MenuItem({label: browserViewMc().text.cut, click: () => webContents.cut()}));
      }

      menu.append(new MenuItem({label: browserViewMc().text.paste, click: () => webContents.paste()}));
      menu.popup({window: this.active.window});
    });
  }

  openURLWithExternalBrowser() {
    this.window.webContents.send(BrowserViewIPCChannels.openURLWithExternalBrowser);
  }

  focusURLInput() {
    this.window.webContents.send(BrowserViewIPCChannels.focusURLInput);
  }

  startSearch() {
    this.window.webContents.send(BrowserViewIPCChannels.startSearch);
  }

  eventConsoleMessage(level: number, message: string) {
    this.window.webContents.send(BrowserViewIPCChannels.eventConsoleMessage, level, message);
  }

  eventDOMReady() {
    this.window.webContents.send(BrowserViewIPCChannels.eventDOMReady);
  }

  eventDidStartNavigation(url: string, inPage: boolean) {
    // 何故かウィンドウ破棄後にイベントが発火してくることがあるので、明示的にチェックする。原因は不明。
    if (this.window.isDestroyed() || this.window.webContents.isDestroyed()) return;

    this.window.webContents.send(BrowserViewIPCChannels.eventDidStartNavigation, url, inPage);
  }

  eventDidNavigate() {
    // 何故かウィンドウ破棄後にイベントが発火してくることがあるので、明示的にチェックする。原因は不明。
    if (this.window.isDestroyed() || this.window.webContents.isDestroyed()) return;

    this.window.webContents.send(BrowserViewIPCChannels.eventDidNavigate);
  }

  eventDidNavigateInPage() {
    this.window.webContents.send(BrowserViewIPCChannels.eventDidNavigateInPage);
  }

  eventBeforeInput(input) {
    this.window.webContents.send(BrowserViewIPCChannels.eventBeforeInput, input);
  }

  eventFoundInPage(result: Electron.Result) {
    this.window.webContents.send(BrowserViewIPCChannels.eventFoundInPage, result);
  }

  eventWillDownload() {
    this.window.webContents.send(BrowserViewIPCChannels.eventWillDownload);
  }

  eventOpenIssueWindow(url: string) {
    this.window.webContents.send(BrowserViewIPCChannels.eventOpenIssueWindow, url);
  }

  loadURL(url: string) {
    // ロードが呼び出されたら強制的に非表示を無効にする
    this.active.hideCount = 0;
    this.hide(false);
    this.active.browserView.setBounds(this.active.rect);

    // 同じURLをロードする場合、ブラウザがスクロール位置を記憶してしまう。
    // そうすると、ハイライトコメント位置への自動スクロールがおかしくなるときがある。
    // なので、クエリパラメータをつけて別のURLとして認識させる。
    // `getURL()`でそのクエリパラメータを削除している
    const currentUrl = this.getURL();
    if (url === currentUrl) {
      this.active.browserView.webContents.loadURL(url + `?t=${Date.now()}`);
    } else {
      this.active.browserView.webContents.loadURL(url);
    }
  }

  getURL() {
    return this.active.browserView.webContents.getURL().replace(/[?]t=\d+/, '');
  }

  reload() {
    this.active.browserView.webContents.reload();
  }

  canGoBack() {
    return this.active.browserView.webContents.canGoBack();
  }

  canGoForward() {
    return this.active.browserView.webContents.canGoForward();
  }

  goBack() {
    return this.active.browserView.webContents.goBack();
  }

  goForward() {
    return this.active.browserView.webContents.goForward();
  }

  focus() {
    return this.active.browserView.webContents.focus();
  }

  blur() {
    return this.active.window.webContents.focus();
  }

  executeJavaScript(js: string) {
    return this.active.browserView.webContents.executeJavaScript(js);
  }

  insertCSS(css: string) {
    this.active.browserView.webContents.insertCSS(css);
  }

  findInPage(keyword: string, options?: Electron.FindInPageOptions) {
    if (keyword) return this.active.browserView.webContents.findInPage(keyword, options);
  }

  stopFindInPage(action) {
    return this.active.browserView.webContents.stopFindInPage(action);
  }

  scroll(amount: number, behavior: 'smooth' | 'auto') {
    this.active.browserView.webContents.executeJavaScript(`window.scrollBy({top: ${amount}, behavior: '${behavior}'})`);
  }

  getWebContents() {
    return this.active.browserView.webContents;
  }

  setZoomFactor(factor) {
    this.active.browserView.webContents.setZoomFactor(factor);
    this.active.zoomFactor = factor;
  }

  setRect(x, y, width, height) {
    const zX = Math.round(x * this.active.zoomFactor);
    const zY = Math.round(y * this.active.zoomFactor);
    const zWidth = Math.round(width * this.active.zoomFactor);
    const zHeight = Math.round(height * this.active.zoomFactor);

    this.active.browserView.setBounds({x: zX, y: zY, width: zWidth, height: zHeight});
    this.active.rect = this.active.browserView.getBounds();
  }

  setBackgroundColor(color) {
    return this.active.browserView.setBackgroundColor(color);
  }

  hide(enable) {
    if (enable) {
      this.active.hideCount++;
      if (this.active.window.getBrowserViews().find(v => v === this.active.browserView)) {
        this.active.window.removeBrowserView(this.active.browserView);
      }
    } else {
      this.active.hideCount = Math.max(0, this.active.hideCount - 1);
      if (this.active.hideCount === 0 && !this.active.window.getBrowserViews().find(v => v === this.active.browserView)) {
        this.active.window.setBrowserView(this.active.browserView);
      }
    }
  }

  private closeIssueWindow() {
    this.issue.window.hide();
    this.issue.browserView.webContents.loadFile(nodePath.join(__dirname, `Main/asset/html/empty.html`));
    this.active = this.main;
    BrowserViewService.initWindow(this.main.window);
    MainWindowMenu.enableShortcut(true);
  }
}

export const BrowserViewService = new _BrowserViewService();
