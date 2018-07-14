import Platform from './Util/Platform';

export default class BrowserViewProxy {
  static setBrowserView(browserView) {
    browserView.setAutoResize({width: true, height: true});
    browserView.setBackgroundColor('#fff');

    this._hide = false;
    this._browserView = browserView;
    this._webContents = browserView.webContents;
    this._layout = null;
    this._zoomFactor = 1;

    this.setLayout('three');

    // this._webContents.openDevTools()
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
    global.mainWindow.webContents.focus();
  }

  static executeJavaScript(js) {
    return this._webContents.executeJavaScript(js);
  }

  static insertCSS(css) {
    return this._webContents.insertCSS(css);
  }

  static findInPage(keyword, option) {
    this._webContents.findInPage(keyword, option);
  }

  static stopFindInPage(action) {
    this._webContents.stopFindInPage(action);
  }

  static setLayout(layout) {
    let [width, height] = global.mainWindow.getSize();

    if (Platform.isWin()) height -= 35; // menu bar height?
    if (Platform.isLinux()) height += 22; // menu bar height?

    if (this._layout === layout) {
      this.setBounds({x: 521, y: 43, width: width - 521, height: height - 43 - 40});
      this._layout = null;
    } else {
      switch (layout) {
        case 'single':
          this.setBounds({x: 1, y: 43, width: width - 1, height: height - 43 - 40});
          break;
        case 'two':
          this.setBounds({x: 301, y: 43, width: width - 301, height: height - 43 - 40});
          break;
        case 'three':
          this.setBounds({x: 521, y: 43, width: width - 521, height: height - 43 - 40});
          break;
      }
      this._layout = layout;
    }
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
      this._browserView.setBounds({x: 9999, y: this._bounds.y, width: this._bounds.width, height: this._bounds.height});
    } else {
      const layout = this._layout;
      this._layout = null;
      this.setLayout(layout);
    }
  }
}
