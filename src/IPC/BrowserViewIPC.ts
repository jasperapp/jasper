import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  loadURL = 'BrowserViewIPC:loadURL',
  getURL = 'BrowserViewIPC:getURL',
  reload = 'BrowserViewIPC:reload',
  canGoBack = 'BrowserViewIPC:canGoBack',
  canGoForward = 'BrowserViewIPC:canGoForward',
  goForward = 'BrowserViewIPC:goForward',
  goBack = 'BrowserViewIPC:goBack',
  focus = 'BrowserViewIPC:focus',
  blur = 'BrowserViewIPC:blur',
  executeJavaScript = 'BrowserViewIPC:executeJavaScript',
  insertCSS = 'BrowserViewIPC:insertCSS',
  findInPage = 'BrowserViewIPC:findInPage',
  stopFindInPage = 'BrowserViewIPC:stopFindInPage',
  setOffsetLeft = `BrowserViewIPC:setOffsetLeft`,
  hide = 'BrowserViewIPC:hide',
}

class _BrowserViewIPC {
  // load url
  async loadURL(url: string) {
    return ipcRenderer.invoke(Channels.loadURL, url);
  }

  onLoadURL(handler: (_ev, url: string) => Promise<void>) {
    ipcMain.handle(Channels.loadURL, handler);
  }

  // get url
  getURL(): string {
    return ipcRenderer.sendSync(Channels.getURL);
  }

  onGetURL(handler: () => string) {
    ipcMain.on(Channels.getURL, ev => ev.returnValue = handler());
  }

  // reload
  async reload() {
    return ipcRenderer.invoke(Channels.reload);
  }

  onReload(handler: () => Promise<void>) {
    return ipcMain.handle(Channels.reload, handler);
  }

  // can go back
  canGoBack(): boolean {
    return ipcRenderer.sendSync(Channels.canGoBack);
  }

  onCanGoBack(handler: () => boolean) {
    ipcMain.on(Channels.canGoBack, ev => ev.returnValue = handler());
  }

  // can go forward
  canGoForward(): boolean {
    return ipcRenderer.sendSync(Channels.canGoForward);
  }

  onCanGoForward(handler: () => boolean) {
    ipcMain.on(Channels.canGoForward, ev => ev.returnValue = handler());
  }

  // go back
  async goBack() {
    return ipcRenderer.invoke(Channels.goBack);
  }

  onGoBack(handler: () => Promise<void>) {
    ipcMain.handle(Channels.goBack, handler);
  }

  // go forward
  async goForward() {
    return ipcRenderer.invoke(Channels.goForward);
  }

  onGoForward(handler: () => Promise<void>) {
    ipcMain.handle(Channels.goForward, handler);
  }

  // focus
  async focus() {
    return ipcRenderer.invoke(Channels.focus);
  }

  onFocus(handler: () => Promise<void>) {
    ipcMain.handle(Channels.focus, handler);
  }

  // blur
  async blur() {
    return ipcRenderer.invoke(Channels.blur);
  }

  onBlur(handler: () => Promise<void>) {
    ipcMain.handle(Channels.blur, handler);
  }

  // execute javascript
  executeJavaScript(js: string) {
    ipcRenderer.send(Channels.executeJavaScript, js);
  }

  onExecuteJavaScript(handler: (_ev, js: string) => void) {
    ipcMain.on(Channels.executeJavaScript, handler);
  }

  // insert css
  insertCSS(css: string) {
    ipcRenderer.send(Channels.insertCSS, css);
  }

  onInsertCSS(handler: (_ev, css: string) => void) {
    ipcMain.on(Channels.insertCSS, handler);
  }

  // find in page
  findInPage(keyword: string, options?) {
    ipcRenderer.send(Channels.findInPage, keyword, options);
  }

  onFindInPage(handler: (_ev, keyword: string, options?) => void) {
    ipcMain.on(Channels.findInPage, handler);
  }

  // stop find in page
  stopFindInPage(action: string) {
    ipcRenderer.send(Channels.findInPage, action);
  }

  onStopFindInPage(handler: (_ev, action) => void) {
    ipcMain.on(Channels.stopFindInPage, handler);
  }

  // set offset left
  setOffsetLeft(offset: number) {
    ipcRenderer.send(Channels.setOffsetLeft, offset);
  }

  onSetOffsetLeft(handler: (_ev, offset: number) => void) {
    ipcMain.on(Channels.setOffsetLeft, handler);
  }

  // hide
  hide(flag: boolean) {
    ipcRenderer.send(Channels.hide, flag);
  }

  onHide(handler: (_ev, flag: boolean) => void) {
    ipcMain.on(Channels.hide, handler);
  }
}

export const BrowserViewIPC = new _BrowserViewIPC();
