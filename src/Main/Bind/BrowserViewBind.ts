import {BrowserWindow, BrowserView} from 'electron';

class _BrowserViewBind {
  private window: BrowserWindow;
  private browserView: BrowserView;
  private zoomFactor = 1;

  async init(window: BrowserWindow) {
    const browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
      }
    });

    window.setBrowserView(browserView);

    browserView.setBackgroundColor('#fff');

    this.browserView = browserView;
    this.window = window;

    browserView.webContents.once('did-finish-load', () => {
      // reset zoom factor.
      // because zoom factor cached by electron
      this.setZoomFactor(window.webContents.getZoomFactor());
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
