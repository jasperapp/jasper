import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  reload = 'MainWindowIPC:reload',
  isSystemDarkTheme = 'MainWindowIPC:isSystemDarkTheme',
  toggleMaximizeWindow = 'MainWindowIPC:toggleMaximizeWindow',
  openNewWindow = 'MainWindowIPC:openNewWindow',
  deleteAllData = 'MainWindowIPC:deleteAllData',
  keyboardShortcut = 'MainWindowIPC:KeyboardShortcutIPC',
  powerMonitorSuspend = 'MainWindowIPC:powerMonitorSuspend',
  powerMonitorResume = 'MainWindowIPC:powerMonitorResume',
  toggleLayout = 'MainWindowIPC:toggleLayout',
  toggleNotification = 'MainWindowIPC:toggleNotification',
  showAbout = 'MainWindowIPC:showAbout',
  showPref = 'MainWindowIPC:showPref',
  showJumpNavigation = 'MainWindowIPC:showJumpNavigation',
  showRecentlyReads = 'MainWindowIPC:showRecentlyReads',
  showExportData = 'MainWindowIPC:showExportData',
}

class _MainWindowIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // reload
  async reload() {
    return ipcRenderer.invoke(Channels.reload);
  }

  onReload(handler: () => void) {
    ipcMain.handle(Channels.reload, handler);
  }

  // is system dark theme
  isSystemDarkTheme(): boolean {
    return ipcRenderer.sendSync(Channels.isSystemDarkTheme);
  }

  onIsSystemDarkTheme(handler: () => boolean) {
    ipcMain.on(Channels.isSystemDarkTheme, ev => ev.returnValue =  handler());
  }

  // toggle maximize window
  async toggleMaximizeWindow() {
    return ipcRenderer.invoke(Channels.toggleMaximizeWindow);
  }

  onToggleMaximizeWindow(handler: () => void) {
    ipcMain.handle(Channels.toggleMaximizeWindow, handler);
  }

  // open new window
  async openNewWindow(url: string) {
    return ipcRenderer.invoke(Channels.openNewWindow, url);
  }

  onOpenNewWindow(handler: (_ev, url: string) => Promise<void>) {
    ipcMain.handle(Channels.openNewWindow, handler);
  }

  // delete all data
  async deleteAllData() {
    return ipcRenderer.invoke(Channels.deleteAllData);
  }

  onDeleteAllData(handler: () => Promise<void>) {
    ipcMain.handle(Channels.deleteAllData, handler);
  }

  // keyboard shortcut
  keyboardShortcut(enable: boolean) {
    ipcRenderer.send(Channels.keyboardShortcut, enable);
  }

  onKeyboardShortcut(handler: (_ev, enable: boolean) => void) {
    ipcMain.on(Channels.keyboardShortcut, handler);
  }

  // power monitor suspend
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorSuspend() {
    this.window.webContents.send(Channels.powerMonitorSuspend);
  }

  onPowerMonitorSuspend(handler: () => void) {
    ipcRenderer.on(Channels.powerMonitorSuspend, handler);
  }

  // power monitor resume
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorResume() {
    this.window.webContents.send(Channels.powerMonitorResume);
  }

  onPowerMonitorResume(handler: () => void) {
    ipcRenderer.on(Channels.powerMonitorResume, handler);
  }

  // toggle layout
  toggleLayout(layout: 'one' | 'two' | 'three') {
    this.window.webContents.send(Channels.toggleLayout, layout);
  }

  onToggleLayout(handler: (layout: 'one' | 'two' | 'three') => void) {
    ipcRenderer.on(Channels.toggleLayout, (_, layout) => handler(layout));
  }


  // toggle notification
  toggleNotification() {
    this.window.webContents.send(Channels.toggleNotification);
  }

  onToggleNotification(handler: () => void) {
    ipcRenderer.on(Channels.toggleNotification, handler);
  }

  // show about
  showAbout() {
    this.window.webContents.send(Channels.showAbout);
  }

  onShowAbout(handler: () => void) {
    ipcRenderer.on(Channels.showAbout, handler);
  }

  // show pref
  showPref() {
    this.window.webContents.send(Channels.showPref);
  }

  onShowPref(handler: () => void) {
    ipcRenderer.on(Channels.showPref, handler);
  }

  // show jump navigation
  showJumpNavigation() {
    this.window.webContents.send(Channels.showJumpNavigation);
  }

  onShowJumpNavigation(handler: () => void) {
    ipcRenderer.on(Channels.showJumpNavigation, handler);
  }

  // show recently reads
  showRecentlyReads() {
    this.window.webContents.send(Channels.showRecentlyReads);
  }

  onShowRecentlyReads(handler: () => void) {
    ipcRenderer.on(Channels.showRecentlyReads, handler);
  }

  // show export desc
  showExportData() {
    this.window.webContents.send(Channels.showExportData);
  }

  onShowExportData(handler: () => void) {
    ipcRenderer.on(Channels.showExportData, handler);
  }
}

export const MainWindowIPC = new _MainWindowIPC();
