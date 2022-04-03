import {BrowserView, BrowserWindow, clipboard, Menu, MenuItem, Rectangle, shell} from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {ShellUtil} from '../../Renderer/Library/Util/ShellUtil';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {PathUtil} from '../Util/PathUtil';
import {MainWindowMenu} from '../Window/MainWindow/MainWindowMenu';
import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

type Target = {
  window: BrowserWindow | null;
  browserView: BrowserView | null;
  rect: Rectangle | null;
  zoomFactor: number;
  hideCount: number;
};

class _BrowserViewBind {
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

  private get active() {
    if (this.issue.window != null) {
      return this.issue;
    } else {
      return this.main;
    }
  }

  async bindIPC(window: BrowserWindow) {
    // init main window
    this.main.window = window;
    this.setupWindow(this.main);
    // github projectでissueをクリックしたときにissue windowで開くようにするため。
    this.main.browserView.webContents.setWindowOpenHandler((details) => {
      this.createIssueWindow(details.url);
      return {action: 'deny'};
    });

    // init issue window
    this.setupWindow(this.issue);

    // bind IPC
    BrowserViewIPC.initWindow(window);
    BrowserViewIPC.onLoadURL(async (_ev, url) => this.loadURL(url));
    BrowserViewIPC.onGetURL(() => this.getURL());
    BrowserViewIPC.onHide((_ev, flag) => this.hide(flag));
    BrowserViewIPC.onReload(async () => this.active.browserView.webContents.reload());
    BrowserViewIPC.onCanGoBack(() => this.active.browserView.webContents.canGoBack());
    BrowserViewIPC.onCanGoForward(() => this.active.browserView.webContents.canGoForward());
    BrowserViewIPC.onGoBack(async () => this.active.browserView.webContents.goBack());
    BrowserViewIPC.onGoForward(async () => this.active.browserView.webContents.goForward());
    BrowserViewIPC.onFocus(async () => this.active.browserView.webContents.focus());
    BrowserViewIPC.onBlur(async () => this.active.window.webContents.focus());
    BrowserViewIPC.onExecuteJavaScript((_ev, js) => this.active.browserView.webContents.executeJavaScript(js));
    BrowserViewIPC.onInsertCSS((_ev, css) => {
      this.active.browserView.webContents.insertCSS(css);
    }); // 値を返却するとエラーになるので{}で囲む
    BrowserViewIPC.onFindInPage((_ev, keyword, options) => {
      if (keyword) return this.active.browserView.webContents.findInPage(keyword, options);
    });
    BrowserViewIPC.onStopFindInPage((_ev, action) => this.active.browserView.webContents.stopFindInPage(action));
    BrowserViewIPC.onSetRect((x, y, width, height) => this.setRect(x, y, width, height));
    BrowserViewIPC.onSetBackgroundColor(color => this.active.browserView.setBackgroundColor(color));

    [this.main.browserView.webContents, this.issue.browserView.webContents].forEach(webContents => {
      webContents.addListener('console-message', (_ev, level, message) => BrowserViewIPC.eventConsoleMessage(level, message));
      webContents.addListener('dom-ready', () => BrowserViewIPC.eventDOMReady());
      webContents.addListener('did-start-navigation', (_ev, url, inPage) => BrowserViewIPC.eventDidStartNavigation(url, inPage));
      webContents.addListener('did-navigate', () => BrowserViewIPC.eventDidNavigate());
      webContents.addListener('did-navigate-in-page', () => BrowserViewIPC.eventDidNavigateInPage());
      webContents.addListener('before-input-event', (_ev, input) => BrowserViewIPC.eventBeforeInput(input));
      webContents.addListener('found-in-page', (_ev, result) => BrowserViewIPC.eventFoundInPage(result));
      webContents.session.on('will-download', () => BrowserViewIPC.eventWillDownload());
    });
  }

  private setupWindow(target: Target) {
    target.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
      }
    });
    target.window?.setBrowserView(this.main.browserView);
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
      const jsFilePath = path.resolve(__dirname, '../asset/js/context-menu.js');
      const js = fs.readFileSync(jsFilePath).toString();
      target.browserView.webContents.executeJavaScript(js);
    });

    webContents.addListener('console-message', (_ev, _level, message) => {
      if (message.indexOf('CONTEXT_MENU:') !== 0) return;

      const data = JSON.parse(message.split('CONTEXT_MENU:')[1]);

      const menu = new Menu();
      if (data.url) {
        menu.append(new MenuItem({label: 'Open browser', click: () => ShellUtil.openExternal(data.url)}));
        menu.append(new MenuItem({label: 'Copy link', click: () => clipboard.writeText(data.url)}));
        menu.append(new MenuItem({type: 'separator'}));
      }

      if (data.text) {
        if (os.platform() === 'darwin') {
          menu.append(new MenuItem({label: 'Search text in dictionary', click: () => shell.openExternal(`dict://${data.text}`)}));
          menu.append(new MenuItem({type: 'separator'}));
        }

        menu.append(new MenuItem({label: 'Copy text', click: () => clipboard.writeText(data.text)}));
        menu.append(new MenuItem({label: 'Cut text', click: () => webContents.cut()}));
      }

      menu.append(new MenuItem({label: 'Paste text', click: () => webContents.paste()}));
      menu.popup({window: this.active.window});
    });
  }

  private loadURL(url: string) {
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

  private getURL() {
    return this.active.browserView.webContents.getURL().replace(/[?]t=\d+/, '');
  }

  scroll(amount: number, behavior: 'smooth' | 'auto') {
    this.active.browserView.webContents.executeJavaScript(`window.scrollBy({top: ${amount}, behavior: '${behavior}'})`);
  }

  getWebContents() {
    return this.active.browserView.webContents;
  }

  private setRect(x: number, y: number, width: number, height: number) {
    const zX = Math.round(x * this.active.zoomFactor);
    const zY = Math.round(y * this.active.zoomFactor);
    const zWidth = Math.round(width * this.active.zoomFactor);
    const zHeight = Math.round(height * this.active.zoomFactor);

    this.active.browserView.setBounds({x: zX, y: zY, width: zWidth, height: zHeight});
    this.active.rect = this.active.browserView.getBounds();
  }

  setZoomFactor(factor) {
    this.active.browserView.webContents.setZoomFactor(factor);
    this.active.zoomFactor = factor;
  }

  private hide(enable) {
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

  private createIssueWindow(url: string) {
    // activeが切り替わる前に、issueを読み込んだことをmain windowのrendererに伝える
    BrowserViewIPC.eventOpenNewWindow(url);

    const [width, height] = this.main.window.getSize();
    const [x, y] = this.main.window.getPosition();
    const offset = 100;

    const options: BrowserWindowConstructorOptions = {
      title: 'Jasper',
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        preload: PathUtil.getPath('/Renderer/asset/html/issue-window-preload.js'),
      },
      x: x + offset / 2,
      y: y + offset / 2,
      width: width - offset,
      height: height - offset,
      parent: this.main.window,
    };

    this.issue.window = new BrowserWindow(options);
    this.issue.window.webContents.setUserAgent(this.main.window.webContents.userAgent);
    this.issue.window.loadURL(`file://${PathUtil.getPath('/Renderer/asset/html/issue-window.html')}?url=${url}`);
    this.issue.window.setBrowserView(this.issue.browserView);
    this.issue.window.addListener('close', () => {
      this.issue.window.removeBrowserView(this.issue.browserView);
      this.issue.window = null;
      this.issue.browserView.webContents.loadURL('data://');
      MainWindowMenu.enableShortcut(true);
      BrowserViewIPC.initWindow(this.main.window);
    });

    MainWindowMenu.enableShortcut(false);
    BrowserViewIPC.initWindow(this.issue.window);

    // if (process.env.JASPER === 'DEV' || parseInt(process.env.DEVTOOLS, 10) === 1) this.issue.window.webContents.openDevTools();
  }
}

export const BrowserViewBind = new _BrowserViewBind();
