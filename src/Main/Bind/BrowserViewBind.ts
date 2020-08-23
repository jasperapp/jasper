import {BrowserWindow, BrowserView, shell, clipboard, Menu, MenuItem} from 'electron';
import fs from 'fs';
import os from 'os';
import path from "path";

class _BrowserViewBind {
  private window: BrowserWindow;
  private browserView: BrowserView;
  private zoomFactor = 1;

  async init(window: BrowserWindow) {
    this.window = window;

    this.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
      }
    });

    this.window.setBrowserView(this.browserView);
    this.browserView.setBackgroundColor('#fff');

    this.setupContextMenu();
  }

  private setupContextMenu() {
    const webContents = this.browserView.webContents;
    webContents.addListener('dom-ready', () => {
      const jsFilePath = path.resolve(__dirname, '../asset/js/context-menu.js');
      const js = fs.readFileSync(jsFilePath).toString();
      this.browserView.webContents.executeJavaScript(js);
    });

    webContents.addListener('console-message', (_ev, _level, message) => {
      if (message.indexOf('CONTEXT_MENU:') !== 0) return;

      const data = JSON.parse(message.split('CONTEXT_MENU:')[1]);

      const menu = new Menu();
      if (data.url) {
        menu.append(new MenuItem({label: 'Open browser', click: () => shell.openExternal(data.url)}));
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

      menu.append(new MenuItem({label: 'Paste text', click: ()=> webContents.paste()}));
      menu.popup({window: this.window});
    });
  }

  loadURL(url: string) {
    // 同じURLをロードする場合、ブラウザがスクロール位置を記憶してしまう。
    // そうすると、ハイライトコメント位置への自動スクロールがおかしくなるときがある。
    // なので、クエリパラメータをつけて別のURLとして認識させる。
    // `getURL()`でそのクエリパラメータを削除している
    const currentUrl = this.getURL();
    if (url === currentUrl) {
      this.browserView.webContents.loadURL(url + `?t=${Date.now()}`);
    } else {
      this.browserView.webContents.loadURL(url);
    }
  }

  getURL() {
    return this.browserView.webContents.getURL().replace(/[?]t=\d+/, '');
  }

  scrollDown() {
    this.browserView.webContents.executeJavaScript('window.scrollBy(0, 40)');
  }

  scrollUp() {
    this.browserView.webContents.executeJavaScript('window.scrollBy(0, -40)');
  }

  getWebContents() {
    return this.browserView.webContents;
  }

  setRect(x: number, y: number, width: number, height: number) {
    const zX = Math.round(x * this.zoomFactor);
    const zY = Math.round(y * this.zoomFactor);
    const zWidth = Math.round(width * this.zoomFactor);
    const zHeight = Math.round(height * this.zoomFactor);

    this.browserView.setBounds({x: zX, y: zY, width: zWidth, height: zHeight});
  }

  setZoomFactor(factor) {
    this.browserView.webContents.setZoomFactor(factor);
    this.zoomFactor = factor;
  }

  hide(enable) {
    if (enable) {
      if (this.window.getBrowserViews().find(v => v === this.browserView)) {
        this.window.removeBrowserView(this.browserView);
      }
    } else {
      if (!this.window.getBrowserViews().find(v => v === this.browserView)) {
        this.window.setBrowserView(this.browserView);
      }
    }
  }
}

export const BrowserViewBind = new _BrowserViewBind();
