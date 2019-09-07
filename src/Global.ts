import BrowserWindow = Electron.BrowserWindow;

export class Global {
  private static mainWindow: BrowserWindow;

  static setMainWindow(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  static getMainWindow() {
    return this.mainWindow;
  }
}
