import {BrowserWindow, BrowserView} from 'electron';
import {PlatformUtil} from '../Util/PlatformUtil';

class _BrowserViewBind {
  private window: BrowserWindow;
  private browserView: BrowserView;
  private layout: 'single' | 'two' | 'three';
  private offsetLeft = 520;
  private zoomFactor = 1;
  private bounds: {x: number; y: number; width: number; height: number};

  async init(window: BrowserWindow) {
    const browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: false,
      }
    });

    window.setBrowserView(browserView);

    browserView.setAutoResize({width: true, height: true, vertical: false, horizontal: false});
    browserView.setBackgroundColor('#fff');

    this.browserView = browserView;
    this.window = window;
    this.layout = null;

    // initialize layout because browser view may be broken on multi window
    this.setLayout('three');

    browserView.webContents.once('did-finish-load', () => {
      // reset bounds.
      // if window size has changed before loading, broken browser view bounds.
      // because browser view auto resize is only available after loading.
      this.setLayout('three');

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

  getWebContents() {
    return this.browserView.webContents;
  }

  setOffsetLeft(offsetLeft) {
    let [width, height] = this.window.getSize();

    if (PlatformUtil.isWin()) height -= 35; // menu bar height?
    if (PlatformUtil.isLinux()) height += 22; // menu bar height?

    this.setBounds({x: offsetLeft + 1, y: 43, width: width - offsetLeft - 1, height: height - 43 - 40});

    this.offsetLeft = offsetLeft;
  }

  setZoomFactor(factor) {
    this.browserView.webContents.setZoomFactor(factor);
    this.zoomFactor = factor;
    this.setBounds(this.bounds);
  }

  hide(enable) {
    if (enable) {
      if (this.window.getBrowserViews().find(v => v === this.browserView)) {
        this.window.removeBrowserView(this.browserView);
      }
    } else {
      if (!this.window.getBrowserViews().find(v => v === this.browserView)) {
        this.window.addBrowserView(this.browserView);
      }
    }
  }

  private setBounds(bounds) {
    this.bounds = bounds;

    const x = Math.round(this.bounds.x * this.zoomFactor);
    const y = Math.round(this.bounds.y * this.zoomFactor);
    const width = this.bounds.width + (this.bounds.x - x);
    const height = this.bounds.height + (this.bounds.y - y);

    this.browserView.setBounds({x, y, width, height});
  }

  private setLayout(layout) {
    const streamPaneWidth = 220
    const issuesPaneWidth = 300

    if (this.layout === layout) {
      this.setOffsetLeft(this.offsetLeft)
      this.layout = null;
    } else {
      switch (layout) {
        case 'single':
          this.setOffsetLeft(0)
          break;
        case 'two':
          this.setOffsetLeft(issuesPaneWidth)
          break;
        case 'three':
          const offsetLeft = streamPaneWidth + issuesPaneWidth
          this.setOffsetLeft(offsetLeft)
          break;
      }
      this.layout = layout;
    }
  }
}

export const BrowserViewBind = new _BrowserViewBind();
