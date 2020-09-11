import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  loadURL = 'BrowserViewIPC:loadURL',
  getURL = 'BrowserViewIPC:getURL',
  reload = 'BrowserViewIPC:reload',
  openURLWithExternalBrowser = 'BrowserViewIPC:openURLWithExternalBrowser',
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
  hide = 'BrowserViewIPC:hide',
  setRect = 'BrowserViewIPC:setRect',

  focusURLInput = 'BrowserViewIPC:focusURLInput',
  startSearch = 'BrowserViewIPC:startSearch',

  eventConsoleMessage = 'BrowserViewIPC:eventConsoleMessage',
  eventDOMReady = 'BrowserViewIPC:eventDOMReady',
  eventDidStartNavigation = 'BrowserViewIPC:eventDidStartLoading',
  eventDidNavigate = 'BrowserViewIPC:eventDidNavigate',
  eventDidNavigateInPage = 'BrowserViewIPC:eventDidNavigateInPage',
  eventBeforeInput = 'BrowserViewIPC:eventBeforeInput',
  eventFoundInPage = 'BrowserViewIPC:eventFoundInPage',
  eventWillDownload = 'BrowserViewIPC:eventWillDownload',
}

class _BrowserViewIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

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

  // open url with external browser
  openURLWithExternalBrowser() {
    this.window.webContents.send(Channels.openURLWithExternalBrowser);
  }

  onOpenURLWithExternalBrowser(handler: () => void) {
    ipcRenderer.on(Channels.openURLWithExternalBrowser, handler);
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

  // hide
  hide(flag: boolean) {
    ipcRenderer.send(Channels.hide, flag);
  }

  onHide(handler: (_ev, flag: boolean) => void) {
    ipcMain.on(Channels.hide, handler);
  }

  // set rect
  setRect(x: number, y: number, width: number, height: number) {
    ipcRenderer.send(Channels.setRect, x, y, width, height);
  }

  onSetRect(handler: (x: number, y: number, width: number, height: number) => void) {
    ipcMain.on(Channels.setRect, (_, x: number, y: number, width: number, height: number) => handler(x, y, width, height));
  }

  // focus URL input
  focusURLInput() {
    this.window.webContents.send(Channels.focusURLInput);
  }

  onFocusURLInput(handler: () => void) {
    ipcRenderer.on(Channels.focusURLInput, handler);
  }

  // start search
  startSearch() {
    this.window.webContents.send(Channels.startSearch);
  }

  onStartSearch(handler: () => void) {
    ipcRenderer.on(Channels.startSearch, handler);
  }

  // event console-message
  eventConsoleMessage(level: number, message: string) {
    this.window.webContents.send(Channels.eventConsoleMessage, level, message);
  }

  onEventConsoleMessage(handler: (level: number, message: string) => void) {
    ipcRenderer.on(Channels.eventConsoleMessage, (_ev, level, message) => handler(level, message));
  }

  // event dom-ready
  eventDOMReady() {
    this.window.webContents.send(Channels.eventDOMReady);
  }

  onEventDOMReady(handler: (_ev) => void) {
    ipcRenderer.on(Channels.eventDOMReady, handler);
  }

  // event did-start-navigation
  eventDidStartNavigation(inPage: boolean) {
    this.window.webContents.send(Channels.eventDidStartNavigation, inPage);
  }

  onEventDidStartNavigation(handler: (_ev, inPage: boolean) => void) {
    ipcRenderer.on(Channels.eventDidStartNavigation, handler);
  }

  // event did-navigate
  eventDidNavigate() {
    this.window.webContents.send(Channels.eventDidNavigate);
  }

  onEventDidNavigate(handler: (_ev) => void) {
    ipcRenderer.on(Channels.eventDidNavigate, handler);
  }

  // event did-navigate-in-page
  eventDidNavigateInPage() {
    this.window.webContents.send(Channels.eventDidNavigateInPage);
  }

  onEventDidNavigateInPage(handler: (_ev) => void) {
    ipcRenderer.on(Channels.eventDidNavigateInPage, handler);
  }

  // event before-input-event
  eventBeforeInput(input) {
    this.window.webContents.send(Channels.eventBeforeInput, input);
  }

  onEventBeforeInput(handler: (input) => void) {
    ipcRenderer.on(Channels.eventBeforeInput, (_ev, input) => handler(input));
  }

  // event found-in-page
  eventFoundInPage(result: Electron.Result) {
    this.window.webContents.send(Channels.eventFoundInPage, result);
  }

  onEventFoundInPage(handler: (result: Electron.Result) => void) {
    ipcRenderer.on(Channels.eventFoundInPage, (_ev, result) => handler(result));
  }

  // event will-download
  eventWillDownload() {
    this.window.webContents.send(Channels.eventWillDownload);
  }

  onEventWillDownload(handler: () => void) {
    ipcRenderer.on(Channels.eventWillDownload, handler);
  }
}

export const BrowserViewIPC = new _BrowserViewIPC();
