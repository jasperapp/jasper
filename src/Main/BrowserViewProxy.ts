import {Platform} from '../Util/Platform';
import BrowserView = Electron.BrowserView;
import webContents = Electron.webContents;
import {AppWindow} from './Window/AppWindow';

class _BrowserViewProxy {
  private _hide = false;
  private _browserView: BrowserView;
  private _webContents: webContents;
  private _layout: 'single' | 'two' | 'three';
  private _offsetLeft = 520;
  private _zoomFactor = 1;
  private _bounds: {x: number; y: number; width: number; height: number};

  setBrowserView(browserView: BrowserView) {
    browserView.setAutoResize({width: true, height: true, vertical: false, horizontal: false});
    browserView.setBackgroundColor('#fff');

    this._browserView = browserView;
    this._webContents = browserView.webContents;
    this._layout = null;

    // initialize layout because browser view may be broken on multi window
    this.setLayout('three');

    this._webContents.once('did-finish-load', () => {
      // reset bounds.
      // if window size has changed before loading, broken browser view bounds.
      // because browser view auto resize is only available after loading.
      this.setLayout('three');

      // reset zoom factor.
      // because zoom factor cached by electron
      this.setZoomFactor(AppWindow.getWindow().webContents.getZoomFactor());
    });
  }

  loadURL(url: string) {
    // 同じURLをロードする場合、ブラウザがスクロール位置を記憶してしまう。
    // そうすると、ハイライトコメント位置への自動スクロールがおかしくなるときがある。
    // なので、クエリパラメータをつけて別のURLとして認識させる。
    // `getURL()`でそのクエリパラメータを削除している
    const currentUrl = this.getURL();
    if (url === currentUrl) {
      this._webContents.loadURL(url + `?t=${Date.now()}`);
    } else {
      this._webContents.loadURL(url);
    }
  }

  getURL() {
    return this._webContents.getURL().replace(/[?]t=\d+/, '');
  }

  getWebContents() {
    return this._browserView.webContents;
  }

  setOffsetLeft(offsetLeft) {
    let [width, height] = AppWindow.getWindow().getSize();

    if (Platform.isWin()) height -= 35; // menu bar height?
    if (Platform.isLinux()) height += 22; // menu bar height?

    this.setBounds({x: offsetLeft + 1, y: 43, width: width - offsetLeft - 1, height: height - 43 - 40});

    this._offsetLeft = offsetLeft;
  }

  setZoomFactor(factor) {
    this._webContents.setZoomFactor(factor);
    this._zoomFactor = factor;
    this.setBounds(this._bounds);
  }

  hide(enable) {
    if (this._hide === enable) return;

    this._hide = enable;

    if (enable) {
      this._browserView.setBounds({x: 9999, y: 9999, width: 0, height: 0});
    } else {
      const layout = this._layout;
      this._layout = null;
      this.setLayout(layout);
    }
  }

  private setBounds(bounds) {
    this._bounds = bounds;

    const x = Math.round(this._bounds.x * this._zoomFactor);
    const y = Math.round(this._bounds.y * this._zoomFactor);
    const width = this._bounds.width + (this._bounds.x - x);
    const height = this._bounds.height + (this._bounds.y - y);

    this._browserView.setBounds({x, y, width, height});
  }

  private setLayout(layout) {
    const streamPaneWidth = 220
    const issuesPaneWidth = 300

    if (this._layout === layout) {
      this.setOffsetLeft(this._offsetLeft)
      this._layout = null;
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
      this._layout = layout;
    }
  }
}

export const BrowserViewProxy = new _BrowserViewProxy();
