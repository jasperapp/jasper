import Platform from './Util/Platform';
import BrowserView = Electron.BrowserView;
import webContents = Electron.webContents;
import {Global} from './Global';

export default class BrowserViewProxy {
  private static _hide = false;
  private static _browserView: BrowserView;
  private static _webContents: webContents;
  private static _layout: 'single' | 'two' | 'three';
  private static _offsetLeft = 520;
  private static _zoomFactor = 1;
  private static _bounds: {x: number; y: number; width: number; height: number};

  static setBrowserView(browserView: BrowserView) {
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
      this.setZoomFactor(Global.getMainWindow().webContents.getZoomFactor());
    });
  }

  static openDevTools(options) {
    this._webContents.openDevTools(options);
  }

  static set src(url) {
    this._webContents.loadURL(url);
  }

  static getURL() {
    return this._webContents.getURL();
  }

  static reload() {
    this._webContents.reload();
  }

  static addEventListener(eventName, listener) {
    return this._webContents.on(eventName, listener);
  }

  static getWebContents() {
    return this._webContents;
  }

  static cut() {
    this._webContents.cut();
  }

  static paste() {
    this._webContents.paste();
  }

  static canGoBack() {
    return this._webContents.canGoBack();
  }

  static canGoForward() {
    return this._webContents.canGoForward();
  }

  static goForward() {
    this._webContents.goForward();
  }

  static goBack() {
    this._webContents.goBack();
  }

  static focus() {
    this._webContents.focus();
  }

  static blur() {
    Global.getMainWindow().webContents.focus();
  }

  static executeJavaScript(js) {
    return this._webContents.executeJavaScript(js);
  }

  static insertCSS(css) {
    return this._webContents.insertCSS(css);
  }

  static findInPage(keyword, option?) {
    this._webContents.findInPage(keyword, option);
  }

  static stopFindInPage(action) {
    this._webContents.stopFindInPage(action);
  }

  static setLayout(layout) {
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

  static setOffsetLeft(offsetLeft) {
    let [width, height] = Global.getMainWindow().getSize();

    if (Platform.isWin()) height -= 35; // menu bar height?
    if (Platform.isLinux()) height += 22; // menu bar height?

    this.setBounds({x: offsetLeft + 1, y: 43, width: width - offsetLeft - 1, height: height - 43 - 40});

    this._offsetLeft = offsetLeft;
  }

  static setBounds(bounds) {
    this._bounds = bounds;

    const x = Math.round(this._bounds.x * this._zoomFactor);
    const y = Math.round(this._bounds.y * this._zoomFactor);
    const width = this._bounds.width + (this._bounds.x - x);
    const height = this._bounds.height + (this._bounds.y - y);

    this._browserView.setBounds({x, y, width, height});
  }

  static setZoomFactor(factor) {
    this._webContents.setZoomFactor(factor);
    this._zoomFactor = factor;
    this.setBounds(this._bounds);
  }

  static hide(enable) {
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
}
